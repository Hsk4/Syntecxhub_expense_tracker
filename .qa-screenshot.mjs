export default async function run(page, ui) {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const d = (offset) => {
    const x = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - offset,
    );
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  };
  const seed = [
    { id: "1", amount: 1450, category: "food", note: "Groceries", date: d(0) },
    { id: "2", amount: 320, category: "transport", note: "Careem", date: d(0) },
    {
      id: "3",
      amount: 8600,
      category: "bills",
      note: "Electricity",
      date: d(1),
    },
    {
      id: "4",
      amount: 2300,
      category: "shopping",
      note: "Running shoes",
      date: d(3),
    },
    { id: "5", amount: 700, category: "health", note: "Pharmacy", date: d(3) },
    { id: "6", amount: 250, category: "other", note: "", date: d(5) },
  ];
  await page.addInitScript((data) => {
    localStorage.setItem("expense-tracker:v1", JSON.stringify(data));
  }, seed);

  const results = {};

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(page.url());
  await page.waitForSelector(".list li");
  results.desktop = await page.evaluate(() => ({
    brandVisible:
      getComputedStyle(document.querySelector(".topbar")).display !== "none",
    fabVisible:
      getComputedStyle(document.querySelector(".fab")).display !== "none",
    columns: getComputedStyle(document.querySelector(".layout"))
      .gridTemplateColumns,
    summaryPos: getComputedStyle(document.querySelector(".summary")).position,
  }));
  await page.screenshot({ path: "shot-desktop.png" });

  await page
    .getByRole("button", { name: /Add expense/ })
    .first()
    .click();
  await page.waitForSelector("dialog.sheet[open]");
  results.dialogOpen = await page.evaluate(() => ({
    modal: document.querySelector("dialog.sheet").matches(":modal"),
    width: document.querySelector(".sheet-panel").getBoundingClientRect().width,
    focused: document.activeElement?.placeholder,
    top: Math.round(
      document.querySelector(".sheet-panel").getBoundingClientRect().top,
    ),
  }));
  await page.screenshot({ path: "shot-desktop-dialog.png" });

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("dialog.sheet"));
  results.escClosed = true;

  // keyboard: enter in amount field saves
  await page
    .getByRole("button", { name: /Add expense/ })
    .first()
    .click();
  await page.waitForSelector("dialog.sheet[open]");
  await page.locator('input[type="number"]').fill("99");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => !document.querySelector("dialog.sheet"));
  results.enterSaved = await page.locator(".list li").count();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "shot-mobile.png" });
  results.mobile = await page.evaluate(() => ({
    brandVisible:
      getComputedStyle(document.querySelector(".topbar")).display !== "none",
    fabVisible:
      getComputedStyle(document.querySelector(".fab")).display !== "none",
    appWidth: document.querySelector(".app").getBoundingClientRect().width,
    hScroll: document.documentElement.scrollWidth > window.innerWidth,
  }));

  await page.locator(".fab").click();
  await page.waitForSelector("dialog.sheet[open]");
  await page.screenshot({ path: "shot-mobile-dialog.png" });

  results.mobileDialog = await page.evaluate(() => {
    const r = document.querySelector(".sheet-panel").getBoundingClientRect();
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      vh: window.innerHeight,
    };
  });

  return results;
}
