import { createCopier } from "./copier";
import { displayValue } from "./fieldDisplay";

let passCount = 0;
let failCount = 0;
let unhandled = false;

process.on("unhandledRejection", () => {
  unhandled = true;
});

async function run(name: string, fn: () => Promise<boolean> | boolean): Promise<void> {
  let ok = false;
  try {
    ok = await fn();
  } catch {
    ok = false;
  }
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (ok) passCount++;
  else failCount++;
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function makeFake(options: { failSet?: boolean; failGet?: boolean } = {}) {
  const state = {
    clip: "",
    nextId: 1,
    timers: new Map<number, { cb: () => void; delay: number }>(),
  };
  const deps = {
    set: async (value: string) => {
      if (options.failSet) throw new Error("set");
      state.clip = value;
    },
    get: async () => {
      if (options.failGet) throw new Error("get");
      return state.clip;
    },
    schedule: (cb: () => void, delay: number) => {
      const id = state.nextId++;
      state.timers.set(id, { cb, delay });
      return id;
    },
    cancel: (id: number) => {
      state.timers.delete(id);
    },
  };
  const fire = async () => {
    const pending = [...state.timers.values()];
    state.timers.clear();
    for (const timer of pending) timer.cb();
    await tick();
  };
  return { state, deps, fire };
}

const AADHAAR = "291837465026";
const PAN = "ABCDE1234F";
const DOTS = "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 5026";

async function main(): Promise<void> {
  await run("displayValue AADHAAR_NO hidden 12 digits", () => displayValue("AADHAAR_NO", "2918 3746 5026", false) === DOTS);
  await run("displayValue AADHAAR_NO revealed 12 digits", () => displayValue("AADHAAR_NO", AADHAAR, true) === "2918 3746 5026");
  await run("displayValue AADHAAR_NO non-12-digit returns unchanged", () => displayValue("AADHAAR_NO", "12345", false) === "12345");
  await run("displayValue other key returns unchanged", () => displayValue("FULL_NAME", "RAMESH KUMAR", false) === "RAMESH KUMAR");

  await run("sensitive copy sets full number and schedules clear", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    const sensitive = await copier.copy("AADHAAR_NO", AADHAAR);
    const timer = [...f.state.timers.values()][0];
    return sensitive && f.state.clip === AADHAAR && f.state.timers.size === 1 && timer.delay === 60000;
  });

  await run("clear fires only if clipboard unchanged", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    await copier.copy("AADHAAR_NO", AADHAAR);
    await f.fire();
    return f.state.clip === "";
  });

  await run("changed clipboard is left alone", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    await copier.copy("AADHAAR_NO", AADHAAR);
    f.state.clip = "something else";
    await f.fire();
    return f.state.clip === "something else";
  });

  await run("second sensitive copy cancels first timer", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    await copier.copy("AADHAAR_NO", AADHAAR);
    await copier.copy("PAN_NO", PAN);
    return f.state.timers.size === 1;
  });

  await run("copying the same sensitive value twice keeps it on the clipboard", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    await copier.copy("AADHAAR_NO", AADHAAR);
    await copier.copy("AADHAAR_NO", AADHAAR);
    await tick();
    return f.state.clip === AADHAAR && f.state.timers.size === 1;
  });

  await run("aadhaar then pan leaves the pan on the clipboard", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    await copier.copy("AADHAAR_NO", AADHAAR);
    await copier.copy("PAN_NO", PAN);
    await tick();
    return f.state.clip === PAN;
  });

  await run("non-sensitive copy schedules nothing", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    const sensitive = await copier.copy("FULL_NAME", "RAMESH KUMAR");
    return !sensitive && f.state.clip === "RAMESH KUMAR" && f.state.timers.size === 0;
  });

  await run("non-sensitive copy after sensitive cancels the pending clear", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    await copier.copy("AADHAAR_NO", AADHAAR);
    await copier.copy("FULL_NAME", "RAMESH KUMAR");
    await f.fire();
    return f.state.timers.size === 0 && f.state.clip === "RAMESH KUMAR";
  });

  await run("copyMany joins in order and schedules clear when any sensitive", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    const sensitive = await copier.copyMany([
      { key: "FULL_NAME", value: "RAMESH KUMAR" },
      { key: "AADHAAR_NO", value: AADHAAR },
    ]);
    await tick();
    return sensitive && f.state.clip === `RAMESH KUMAR\n${AADHAAR}` && f.state.timers.size === 1;
  });

  await run("copyMany non-sensitive only schedules nothing", async () => {
    const f = makeFake();
    const copier = createCopier(f.deps);
    const sensitive = await copier.copyMany([
      { key: "FULL_NAME", value: "RAMESH KUMAR" },
      { key: "DOB", value: "15/08/1985" },
    ]);
    return !sensitive && f.state.timers.size === 0;
  });

  await run("error in set returns false", async () => {
    const f = makeFake({ failSet: true });
    const copier = createCopier(f.deps);
    const sensitive = await copier.copy("AADHAAR_NO", AADHAAR);
    return sensitive === false && f.state.timers.size === 0;
  });

  await run("error in get during clear is swallowed", async () => {
    const f = makeFake({ failGet: true });
    const copier = createCopier(f.deps);
    await copier.copy("AADHAAR_NO", AADHAAR);
    await f.fire();
    await tick();
    return !unhandled && f.state.clip === AADHAAR;
  });

  console.log("");
  console.log(`PASS: ${passCount}, FAIL: ${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
}

main();
