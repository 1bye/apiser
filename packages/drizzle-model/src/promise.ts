export interface IModelFunctionResult<R, T> extends Promise<T> {
  return(): Promise<R>;
}

export class ModelFunctionResult<
  R,
  T extends void = void,
> implements IModelFunctionResult<T, R> {
  constructor(private query: any) {}

  return() {
    this.query = this.query.returning();
    return this;
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    return this.query.then(onfulfilled, onrejected);
  }

  catch<TResult2 = never>(
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ) {
    return this.query.catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.query.finally(onfinally);
  }

  // required by TS
  [Symbol.toStringTag] = "Promise";
}
