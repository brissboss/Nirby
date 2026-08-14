import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreatePoi } from "../hooks/use-create-poi";
import { useUploadPoiPhoto } from "../hooks/use-upload-poi-photo";

import { CreatePoiForm } from "./create-poi-form";

import { useAddPoiToList } from "@/features/lists/hooks/use-add-poi-to-list";

vi.mock("../hooks/use-create-poi", () => ({
  useCreatePoi: vi.fn(),
}));

vi.mock("../hooks/use-upload-poi-photo", () => ({
  useUploadPoiPhoto: vi.fn(),
}));

vi.mock("@/features/lists/hooks/use-add-poi-to-list", () => ({
  useAddPoiToList: vi.fn(),
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

const coordinates = { latitude: 48.8566, longitude: 2.3522 };

describe("CreatePoiForm", () => {
  const closeDialog = vi.fn();
  const createPoi = vi.fn();
  const uploadPoiPhoto = vi.fn();
  const addPoiToList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createPoi.mockResolvedValue({ poi: { id: "poi-1", name: "Secret spot" } });
    uploadPoiPhoto.mockResolvedValue({ url: "https://cdn.example.com/spot.webp" });
    addPoiToList.mockResolvedValue({ savedPoi: { id: "saved-1", poiId: "poi-1" } });
    vi.mocked(useCreatePoi).mockReturnValue({
      mutateAsync: createPoi,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePoi>);
    vi.mocked(useUploadPoiPhoto).mockReturnValue({
      mutateAsync: uploadPoiPhoto,
      isPending: false,
    } as unknown as ReturnType<typeof useUploadPoiPhoto>);
    vi.mocked(useAddPoiToList).mockReturnValue({
      mutateAsync: addPoiToList,
      isPending: false,
    } as unknown as ReturnType<typeof useAddPoiToList>);
  });

  it("shows validation messages for required fields without lat/lng inputs", async () => {
    const user = userEvent.setup();

    render(<CreatePoiForm coordinates={coordinates} closeDialog={closeDialog} />);

    await user.click(screen.getByRole("button", { name: "create.submit" }));

    expect(await screen.findByText("validation.requiredName")).toBeInTheDocument();
    expect(screen.queryByText("validation.latitudeInvalid")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("fields.latitude")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("fields.longitude")).not.toBeInTheDocument();
    expect(createPoi).not.toHaveBeenCalled();
    expect(uploadPoiPhoto).not.toHaveBeenCalled();
  });

  it("submits createPoi with map coordinates when no photo is selected", async () => {
    const user = userEvent.setup();

    render(<CreatePoiForm coordinates={coordinates} closeDialog={closeDialog} />);

    await user.type(screen.getByLabelText("fields.name"), "Secret spot");
    await user.click(screen.getByRole("button", { name: "create.submit" }));

    await waitFor(() => {
      expect(createPoi).toHaveBeenCalledWith({
        name: "Secret spot",
        latitude: 48.8566,
        longitude: 2.3522,
        description: undefined,
        address: undefined,
        visibility: "PRIVATE",
        category: undefined,
      });
    });

    expect(uploadPoiPhoto).not.toHaveBeenCalled();
    expect(addPoiToList).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("createPoi.success");
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });

  it("uploads the photo then creates the POI with photoUrls", async () => {
    const user = userEvent.setup();
    const file = new File(["photo"], "spot.webp", { type: "image/webp" });

    render(<CreatePoiForm coordinates={coordinates} closeDialog={closeDialog} />);

    await user.type(screen.getByLabelText("fields.name"), "Secret spot");

    const photoInput = document.querySelector('input[type="file"]');
    expect(photoInput).toBeInstanceOf(HTMLInputElement);
    await user.upload(photoInput as HTMLInputElement, file);

    await user.click(screen.getByRole("button", { name: "create.submit" }));

    await waitFor(() => {
      expect(uploadPoiPhoto).toHaveBeenCalledWith({ file });
      expect(createPoi).toHaveBeenCalledWith({
        name: "Secret spot",
        latitude: 48.8566,
        longitude: 2.3522,
        description: undefined,
        address: undefined,
        visibility: "PRIVATE",
        category: undefined,
        photoUrls: ["https://cdn.example.com/spot.webp"],
      });
    });

    expect(uploadPoiPhoto.mock.invocationCallOrder[0]).toBeLessThan(
      createPoi.mock.invocationCallOrder[0]
    );
  });

  it("shows an error toast when createPoi fails", async () => {
    const user = userEvent.setup();
    createPoi.mockRejectedValue({ message: "Forbidden" });

    render(<CreatePoiForm coordinates={coordinates} closeDialog={closeDialog} />);

    await user.type(screen.getByLabelText("fields.name"), "Secret spot");
    await user.click(screen.getByRole("button", { name: "create.submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("createPoi.error", {
        description: "API error message",
      });
    });

    expect(closeDialog).not.toHaveBeenCalled();
  });

  it("adds the created POI to the list when listId is provided", async () => {
    const user = userEvent.setup();

    render(<CreatePoiForm coordinates={coordinates} listId="list-1" closeDialog={closeDialog} />);

    await user.type(screen.getByLabelText("fields.name"), "Secret spot");
    await user.click(screen.getByRole("button", { name: "create.submit" }));

    await waitFor(() => {
      expect(createPoi).toHaveBeenCalled();
      expect(addPoiToList).toHaveBeenCalledWith({
        listId: "list-1",
        body: { poiId: "poi-1" },
      });
    });

    expect(createPoi.mock.invocationCallOrder[0]).toBeLessThan(
      addPoiToList.mock.invocationCallOrder[0]
    );
    expect(toast.success).toHaveBeenCalledWith("addPoi.success");
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when addPoiToList fails after create", async () => {
    const user = userEvent.setup();
    addPoiToList.mockRejectedValue({ message: "Forbidden" });

    render(<CreatePoiForm coordinates={coordinates} listId="list-1" closeDialog={closeDialog} />);

    await user.type(screen.getByLabelText("fields.name"), "Secret spot");
    await user.click(screen.getByRole("button", { name: "create.submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("addPoi.error", {
        description: "API error message",
      });
    });

    expect(createPoi).toHaveBeenCalled();
    expect(closeDialog).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
