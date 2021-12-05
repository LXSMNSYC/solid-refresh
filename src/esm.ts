import { createSignal, createMemo, untrack, JSX } from "solid-js";

interface HotComponent<P> {
  (props: P): JSX.Element;
  setComp: (action: () => HotComponent<P>) => void;
  setSign: (action: () => string) => void;
  sign: () => string;
}

interface HotRegistration<P> {
  component: HotComponent<P>;
  signature: string;
}

interface HotModule<P> {
  $$registrations: Record<string, HotRegistration<P>>;
}

export default function hot<P>(
  Comp: HotComponent<P>,
  id: string,
  initialSignature: string | undefined,
  isHot: boolean,
) {
  let Component: (props: P) => JSX.Element = Comp;
  function handler(newModule: HotModule<P>) {
    const registration = newModule.$$registrations[id];
    registration.component.setComp = Comp.setComp;
    if (initialSignature) {
      registration.component.setSign = Comp.setSign;
      registration.component.sign = Comp.sign;
      if (registration.signature !== Comp.sign()) {
        Comp.setSign(() => registration.signature);
        Comp.setComp(() => registration.component);
      }
    } else {
      Comp.setComp(() => registration.component);
    }
  }
  if (isHot) {
    const [comp, setComp] = createSignal(Comp);
    Comp.setComp = setComp;
    if (initialSignature) {
      const [signature, setSignature] = createSignal(initialSignature);
      Comp.setSign = setSignature;
      Comp.sign = signature;
    }
    Component = new Proxy((props: P) => (
      createMemo(() => {
        const c = comp();
        if (c) {
          return untrack(() => c(props));
        }
        return undefined;
      })
    ), {
      get(_, property: keyof typeof Comp) {
        return comp()[property];
      }
    });
  }
  return { Component, handler };
}
