'use client';

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { decrement, increment } from "@/store/slice";

export default function HomeClient({ user }: { user: any }) {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div className="flex justify-center items-center">
      <div>
        <div className="flex gap-4 items-center">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            aria-label="Increment value"
            onClick={() => dispatch(increment())}
          >
            Increment
          </button>
          <span className="text-2xl font-bold">{count}</span>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            aria-label="Decrement value"
            onClick={() => dispatch(decrement())}
          >
            Decrement
          </button>
        </div>
        {user && (
          <div className="mt-4">
            <p>Welcome, {user.name}!</p>
          </div>
        )}
      </div>
    </div>
  );
}