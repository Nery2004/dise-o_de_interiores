type QueueTask<Request, Response> = {
  id: number;
  request: Request;
  transfer: Transferable[];
  priority: number;
  signal?: AbortSignal;
  resolve: (response: Response) => void;
  reject: (error: unknown) => void;
  abort?: () => void;
};

type WorkerSlot<Request, Response> = {
  worker: Worker;
  task: QueueTask<Request, Response> | null;
};

export class WorkerPool<Request extends object, Response extends { id: number }> {
  private readonly slots: Array<WorkerSlot<Request, Response>> = [];
  private readonly queue: Array<QueueTask<Request, Response>> = [];
  private sequence = 0;
  private disposed = false;

  constructor(
    private readonly factory: () => Worker,
    private readonly maximumSize: number,
  ) {}

  run(request: Request, transfer: Transferable[] = [], signal?: AbortSignal, priority = 0) {
    if (this.disposed) return Promise.reject(new Error("WorkerPool cerrado"));
    if (signal?.aborted) return Promise.reject(new DOMException("Operación cancelada", "AbortError"));
    return new Promise<Response>((resolve, reject) => {
      const task: QueueTask<Request, Response> = { id: ++this.sequence, request, transfer, priority, signal, resolve, reject };
      task.abort = () => this.cancel(task);
      signal?.addEventListener("abort", task.abort, { once: true });
      this.queue.push(task);
      this.queue.sort((a, b) => b.priority - a.priority || a.id - b.id);
      this.dispatch();
    });
  }

  stats() {
    return { workers: this.slots.length, active: this.slots.filter((slot) => slot.task).length, queued: this.queue.length, maximumSize: this.maximumSize };
  }

  dispose() {
    this.disposed = true;
    for (const task of this.queue.splice(0)) this.reject(task, new DOMException("Pool cerrado", "AbortError"));
    for (const slot of this.slots) {
      if (slot.task) this.reject(slot.task, new DOMException("Pool cerrado", "AbortError"));
      slot.worker.terminate();
    }
    this.slots.length = 0;
  }

  private createSlot() {
    const slot: WorkerSlot<Request, Response> = { worker: this.factory(), task: null };
    slot.worker.onmessage = (event: MessageEvent<Response>) => {
      if (!slot.task || event.data.id !== slot.task.id) return;
      const task = slot.task;
      slot.task = null;
      task.signal?.removeEventListener("abort", task.abort!);
      task.resolve(event.data);
      this.dispatch();
    };
    slot.worker.onerror = () => {
      const task = slot.task;
      if (task) this.reject(task, new Error("Worker falló"));
      slot.worker.terminate();
      const index = this.slots.indexOf(slot);
      if (index >= 0) this.slots.splice(index, 1);
      this.dispatch();
    };
    this.slots.push(slot);
    return slot;
  }

  private dispatch() {
    if (this.disposed) return;
    while (this.queue.length) {
      let slot = this.slots.find((item) => !item.task);
      if (!slot && this.slots.length < Math.max(1, this.maximumSize)) slot = this.createSlot();
      if (!slot) return;
      const task = this.queue.shift()!;
      slot.task = task;
      slot.worker.postMessage({ ...task.request, id: task.id }, { transfer: task.transfer });
    }
  }

  private cancel(task: QueueTask<Request, Response>) {
    const queued = this.queue.indexOf(task);
    if (queued >= 0) {
      this.queue.splice(queued, 1);
      this.reject(task, new DOMException("Operación cancelada", "AbortError"));
      return;
    }
    const slot = this.slots.find((item) => item.task === task);
    if (!slot) return;
    slot.worker.terminate();
    slot.task = null;
    this.slots.splice(this.slots.indexOf(slot), 1);
    this.reject(task, new DOMException("Operación cancelada", "AbortError"));
    this.dispatch();
  }

  private reject(task: QueueTask<Request, Response>, error: unknown) {
    task.signal?.removeEventListener("abort", task.abort!);
    task.reject(error);
  }
}
