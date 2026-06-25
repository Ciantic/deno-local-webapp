/**
 * Debounces an async function, executing only the latest call after a delay.
 *
 * Multiple calls within the delay period will reuse the same pending promise.
 * Useful for expensive operations that should wait until activity settles.
 *
 * @param fn The async function to debounce
 * @param delay The delay in milliseconds before executing
 * @returns A debounced version of the function
 */
export function asyncDebounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<Awaited<ReturnType<T>>> | null = null;

  return ((...args: Parameters<T>): Promise<ReturnType<T>> => {
    console.log("Debounced function called with args:", args);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          fn(...args)
            .then(resolve)
            .finally(() => {
              pendingPromise = null;
              timeoutId = null;
            });
        }, delay);
      });
    }

    return pendingPromise;
  }) as T;
}

/**
 * Debounces an async function, canceling previous timeouts and executing with the latest arguments.
 *
 * Each new call cancels the previous timeout. Only the most recent call after the delay period executes.
 * Useful for input handlers where you want a single final request after the user stops.
 *
 * @param fn The async function to debounce
 * @param delay The delay in milliseconds before executing
 * @returns A debounced version of the function
 */
export function asyncLatestDebounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        fn(...args)
          .then(resolve)
          .catch(reject);
      }, delay);
    });
  };
}

/**
 * Throttles an async function to execute at most once every interval.
 *
 * Executes immediately on first call, then queues calls with the latest arguments
 * until the interval expires. Perfect for input handlers that should send requests
 * periodically while the user is still typing.
 *
 * @param fn The async function to throttle
 * @param interval The interval in milliseconds between executions
 * @returns A throttled version of the function
 */
export function asyncThrottle<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let lastRunTime = 0;
  let pendingPromise: Promise<Awaited<ReturnType<T>>> | null = null;
  let latestArgs: Parameters<T> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    latestArgs = args;
    const now = Date.now();
    const timeSinceLastRun = now - lastRunTime;

    const executeFunction = () => {
      if (latestArgs) {
        lastRunTime = Date.now();
        pendingPromise = Promise.resolve(fn(...latestArgs));
      }
    };

    if (timeSinceLastRun >= interval) {
      // Interval has passed, execute immediately
      executeFunction();
    } else if (!timeoutId) {
      // Schedule execution for when interval expires
      const delay = interval - timeSinceLastRun;
      timeoutId = setTimeout(() => {
        executeFunction();
        timeoutId = null;
      }, delay);
    }

    return pendingPromise || Promise.resolve(undefined as any);
  };
}

/**
 * Ensures only one call to an async function is in-flight at a time.
 *
 * When the function is called while a request is pending, the pending promise is awaited
 * first before the new request starts. Prevents duplicate concurrent requests.
 *
 * @param fn The async function to wrap
 * @returns A version of the function that ensures single in-flight calls
 */
export function asyncSingleInFlight<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let currentPromise: Promise<Awaited<ReturnType<T>>> | null = null;

  return (async (...args: Parameters<T>) => {
    if (currentPromise) {
      await currentPromise; // wait for current to finish
    }
    currentPromise = fn(...args);
    try {
      return await currentPromise;
    } finally {
      currentPromise = null;
    }
  }) as T;
}

/**
 * Throttles a function to execute at most once every interval, ensuring only a single in-flight call.
 *
 * Good for e.g. input that filters results from server - ensures we don't send too many requests, and only the latest one is active.
 *
 * Combines asyncThrottle and asyncSingleInFlight to achieve this behavior.
 *
 * @param fn The function to be throttled and ensured single in-flight call.
 * @param interval The interval in milliseconds to throttle the function.
 * @returns A new function that is throttled and ensures only a single in-flight call.
 */
export function asyncThrottleSingleInFlight<
  T extends (...args: any[]) => Promise<any>,
>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return asyncThrottle(asyncSingleInFlight(fn), interval);
}
