import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tauriMocks = vi.hoisted(() => ({
  getLocaleStrings: vi.fn(),
  setUiLanguage: vi.fn(),
}));

const eventMocks = vi.hoisted(() => ({
  listen: vi.fn(),
}));

vi.mock("../lib/tauri", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/tauri")>()),
  ...tauriMocks,
}));
vi.mock("@tauri-apps/api/event", () => eventMocks);

import { LocaleProvider } from "../i18n/LocaleProvider";
import { buildBundle } from "../test/localeHarness";
import MenuSurface, { MenuSummary } from "./MenuSurface";

function renderSummary(total: number) {
  return render(
    <LocaleProvider>
      <MenuSummary
        total={total}
        errorCount={0}
        isRefreshing={false}
        lastRefresh={null}
      />
    </LocaleProvider>,
  );
}

describe("MenuSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tauriMocks.getLocaleStrings.mockResolvedValue(
      buildBundle({ SummaryProvidersLabel: "providers" }),
    );
    eventMocks.listen.mockResolvedValue(() => {});
  });

  it("uses a singular provider label for one provider", async () => {
    renderSummary(1);

    expect(await screen.findByText("1 provider")).toBeInTheDocument();
  });

  it("keeps the plural provider label for multiple providers", async () => {
    renderSummary(2);

    expect(await screen.findByText("2 providers")).toBeInTheDocument();
  });
});

describe("MenuSurface tray drag handle", () => {
  it("renders a controlled drag handle for tray panels", () => {
    const onDragHandlePointerDown = vi.fn();

    const { container } = render(
      <MenuSurface
        variant="tray"
        onRefresh={vi.fn()}
        isRefreshing={false}
        actions={[]}
        onDragHandlePointerDown={onDragHandlePointerDown}
      >
        <div>Body</div>
      </MenuSurface>,
    );

    const handle = container.querySelector<HTMLElement>(
      ".menu-surface__drag-handle",
    );
    expect(handle).not.toBeNull();
    expect(handle?.hasAttribute("data-tauri-drag-region")).toBe(false);

    fireEvent.pointerDown(handle!);

    expect(onDragHandlePointerDown).toHaveBeenCalledTimes(1);
  });

  it("does not render the tray drag handle for popout panels", () => {
    const { container } = render(
      <MenuSurface
        variant="popout"
        onRefresh={vi.fn()}
        isRefreshing={false}
        actions={[]}
      >
        <div>Body</div>
      </MenuSurface>,
    );

    expect(container.querySelector(".menu-surface__drag-handle")).toBeNull();
  });
});
