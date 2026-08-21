import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreatePoiFromMap, CREATE_POI_AT_EVENT } from "./create-poi-from-map";

import { useList } from "@/features/lists/hooks/use-list";

const gesture = vi.hoisted(() => ({
  onPoint: null as null | ((point: { latitude: number; longitude: number }) => void),
}));

let searchParams = new URLSearchParams();
const container = document.createElement("div");

const markerInstances: Array<{
  setLngLat: ReturnType<typeof vi.fn>;
  addTo: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}> = [];

const useMapMock = vi.fn(() => ({
  map: {
    getContainer: () => container,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/features/map/context", () => ({
  useMap: () => useMapMock(),
}));

vi.mock("@/features/lists/hooks/use-list", () => ({
  useList: vi.fn(),
}));

vi.mock("../hooks/use-map-create-poi-gesture", () => ({
  useMapCreatePoiGesture: (
    _map: unknown,
    onPoint: (point: { latitude: number; longitude: number }) => void
  ) => {
    gesture.onPoint = onPoint;
  },
}));

vi.mock("./create-poi-dialog", () => ({
  CreatePoiDialog: ({
    open,
    coordinates,
    listId,
  }: {
    open: boolean;
    coordinates: { latitude: number; longitude: number };
    listId?: string;
  }) =>
    open ? (
      <div
        data-testid="create-poi-dialog"
        data-list-id={listId ?? ""}
        data-lat={String(coordinates.latitude)}
        data-lng={String(coordinates.longitude)}
      />
    ) : null,
}));

vi.mock("mapbox-gl", () => {
  class Marker {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();

    constructor() {
      markerInstances.push(this);
    }
  }

  return { default: { Marker } };
});

function pickPoint(lat = 48.8566, lng = 2.3522) {
  act(() => {
    gesture.onPoint?.({ latitude: lat, longitude: lng });
  });
}

describe("CreatePoiFromMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markerInstances.length = 0;
    gesture.onPoint = null;
    searchParams = new URLSearchParams();
    vi.mocked(useList).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useList>);
    useMapMock.mockReturnValue({
      map: {
        getContainer: () => container,
      },
    });
  });

  it("opens the create dialog from a map point without showing lat/lng fields", () => {
    render(<CreatePoiFromMap />);

    expect(screen.queryByTestId("create-poi-dialog")).not.toBeInTheDocument();

    pickPoint();

    const dialog = screen.getByTestId("create-poi-dialog");
    expect(dialog).toHaveAttribute("data-lat", "48.8566");
    expect(dialog).toHaveAttribute("data-lng", "2.3522");
    expect(screen.queryByLabelText("fields.latitude")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("fields.longitude")).not.toBeInTheDocument();
    expect(markerInstances).toHaveLength(1);
    expect(markerInstances[0].setLngLat).toHaveBeenCalledWith([2.3522, 48.8566]);
  });

  it("opens the create dialog from the e2e window event without a map gesture", () => {
    render(<CreatePoiFromMap />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent(CREATE_POI_AT_EVENT, {
          detail: { latitude: 48.85, longitude: 2.35 },
        })
      );
    });

    const dialog = screen.getByTestId("create-poi-dialog");
    expect(dialog).toHaveAttribute("data-lat", "48.85");
    expect(dialog).toHaveAttribute("data-lng", "2.35");
  });

  it("passes listId when the open list is editable", () => {
    searchParams = new URLSearchParams("listId=list-1");
    vi.mocked(useList).mockReturnValue({
      data: { list: { role: "EDITOR" } },
    } as unknown as ReturnType<typeof useList>);

    render(<CreatePoiFromMap />);
    pickPoint();

    expect(screen.getByTestId("create-poi-dialog")).toHaveAttribute("data-list-id", "list-1");
  });

  it("omits listId when the open list is view-only", () => {
    searchParams = new URLSearchParams("listId=list-1");
    vi.mocked(useList).mockReturnValue({
      data: { list: { role: "VIEWER" } },
    } as unknown as ReturnType<typeof useList>);

    render(<CreatePoiFromMap />);
    pickPoint();

    expect(screen.getByTestId("create-poi-dialog")).toHaveAttribute("data-list-id", "");
  });
});
