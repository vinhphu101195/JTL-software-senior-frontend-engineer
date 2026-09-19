import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAtomValue, type Atom } from "jotai";

/**
 * Backs a text input with a local, editable value that defaults to — and
 * stays synced with — an atom, until the user types their own value. A plain
 * `useState(atomValue ?? "")` initializer only reads the atom once at mount,
 * so it goes stale if the atom changes while the field stays mounted; this
 * re-syncs on every atom change via `touched` as the guard so it never
 * clobbers what the user is actively typing.
 */
export function useDefaultedFromAtom(sourceAtom: Atom<string | null>) {
  const atomValue = useAtomValue(sourceAtom);
  const [value, setValue] = useState(atomValue ?? "");
  const touched = useRef(false);

  useEffect(() => {
    if (!touched.current) {
      setValue(atomValue ?? "");
    }
  }, [atomValue]);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    touched.current = true;
    setValue(event.target.value);
  }

  /** Call after the value has been consumed (e.g. on submit) to resume following the atom. */
  function reset() {
    touched.current = false;
  }

  return { value, onChange, reset } as const;
}
