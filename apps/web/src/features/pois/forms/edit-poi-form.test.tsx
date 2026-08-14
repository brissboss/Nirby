import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdatePoi } from "../hooks/use-update-poi";
import { useUploadPoiPhoto } from "../hooks/use-upload-poi-photo";

import { EditPoiForm } from "./edit-poi-form";

import type { Poi } from "@/lib/api";

vi.mock("../hooks/use-update-poi", () => ({
  useUpdatePoi: vi.fn(),
}));

vi.mock("../hooks/use-upload-poi-photo", () => ({
  useUploadPoiPhoto: vi.fn(),
}));

vi.mock("../components/poi-photo", () => ({
  PoiPhoto: ({ alt }: { alt: string }) => <div data-testid="existing-poi-photo">{alt}</div>,
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const poi: Poi & { id: string } = {
  id: "poi-1",
  name: "Secret spot",
  description: "A quiet garden",
  address: "12 rue Example",
  latitude: 48.8566,
  longitude: 2.3522,
  visibility: "PRIVATE",
  category: "park",
  createdBy: "user-1",
  photoUrls: [],
};

describe("EditPoiForm", () => {
  const closeDialog = vi.fn();
  const updatePoi = vi.fn();
  const uploadPoiPhoto = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    updatePoi.mockResolvedValue({ poi: { ...poi, name: "Updated spot" } });
    uploadPoiPhoto.mockResolvedValue({ url: "https://cdn.example.com/spot.webp" });
    vi.mocked(useUpdatePoi).mockReturnValue({
      mutateAsync: updatePoi,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdatePoi>);
    vi.mocked(useUploadPoiPhoto).mockReturnValue({
      mutateAsync: uploadPoiPhoto,
      isPending: false,
    } as unknown as ReturnType<typeof useUploadPoiPhoto>);
  });

  it("prefills fields and hides lat/lng inputs", () => {
    render(<EditPoiForm poi={poi} listId="list-1" closeDialog={closeDialog} />);

    expect(screen.getByLabelText("fields.name")).toHaveValue("Secret spot");
    expect(screen.getByLabelText("fields.description")).toHaveValue("A quiet garden");
    expect(screen.getByLabelText("fields.address")).toHaveValue("12 rue Example");
    expect(screen.queryByLabelText("fields.latitude")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("fields.longitude")).not.toBeInTheDocument();
  });

  it("shows the existing photo and omits photoUrls when none is added", async () => {
    const user = userEvent.setup();
    const poiWithPhoto = {
      ...poi,
      photoUrls: ["https://cdn.example.com/existing.jpg"],
    };

    render(<EditPoiForm poi={poiWithPhoto} listId="list-1" closeDialog={closeDialog} />);

    expect(screen.getByTestId("existing-poi-photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "photo.replaceHint" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "edit.submit" }));

    await waitFor(() => {
      expect(updatePoi).toHaveBeenCalledWith({
        poiId: "poi-1",
        listId: "list-1",
        body: expect.not.objectContaining({ photoUrls: expect.anything() }),
      });
    });

    expect(uploadPoiPhoto).not.toHaveBeenCalled();
  });

  it("submits updatePoi with existing coordinates and no photo", async () => {
    const user = userEvent.setup();

    render(<EditPoiForm poi={poi} listId="list-1" closeDialog={closeDialog} />);

    await user.clear(screen.getByLabelText("fields.name"));
    await user.type(screen.getByLabelText("fields.name"), "Updated spot");
    await user.click(screen.getByRole("button", { name: "edit.submit" }));

    await waitFor(() => {
      expect(updatePoi).toHaveBeenCalledWith({
        poiId: "poi-1",
        listId: "list-1",
        body: {
          name: "Updated spot",
          latitude: 48.8566,
          longitude: 2.3522,
          description: "A quiet garden",
          address: "12 rue Example",
          visibility: "PRIVATE",
          category: "park",
        },
      });
    });

    expect(uploadPoiPhoto).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("updatePoi.success");
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });

  it("uploads a photo then updates the POI with photoUrls", async () => {
    const user = userEvent.setup();
    const file = new File(["photo"], "spot.webp", { type: "image/webp" });

    render(<EditPoiForm poi={poi} listId="list-1" closeDialog={closeDialog} />);

    const photoInput = document.querySelector('input[type="file"]');
    expect(photoInput).toBeInstanceOf(HTMLInputElement);
    await user.upload(photoInput as HTMLInputElement, file);
    await user.click(screen.getByRole("button", { name: "edit.submit" }));

    await waitFor(() => {
      expect(uploadPoiPhoto).toHaveBeenCalledWith({ file });
      expect(updatePoi).toHaveBeenCalledWith({
        poiId: "poi-1",
        listId: "list-1",
        body: expect.objectContaining({
          photoUrls: ["https://cdn.example.com/spot.webp"],
        }),
      });
    });

    expect(uploadPoiPhoto.mock.invocationCallOrder[0]).toBeLessThan(
      updatePoi.mock.invocationCallOrder[0]
    );
  });

  it("shows an error toast when updatePoi fails", async () => {
    const user = userEvent.setup();
    updatePoi.mockRejectedValue({ message: "Forbidden" });

    render(<EditPoiForm poi={poi} listId="list-1" closeDialog={closeDialog} />);

    await user.click(screen.getByRole("button", { name: "edit.submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("updatePoi.error", {
        description: "API error message",
      });
    });

    expect(closeDialog).not.toHaveBeenCalled();
  });
});
