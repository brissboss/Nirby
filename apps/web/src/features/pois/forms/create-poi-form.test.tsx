import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreatePoi } from "../hooks/use-create-poi";
import { useUploadPoiPhoto } from "../hooks/use-upload-poi-photo";

import { CreatePoiForm } from "./create-poi-form";

import { useAddPoiToList, useLists } from "@/features/lists";

vi.mock("../hooks/use-create-poi", () => ({
  useCreatePoi: vi.fn(),
}));

vi.mock("../hooks/use-upload-poi-photo", () => ({
  useUploadPoiPhoto: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/lists", async () => {
  const actual = await vi.importActual<typeof import("@/features/lists")>("@/features/lists");
  return {
    ...actual,
    useLists: vi.fn(),
    useAddPoiToList: vi.fn(),
  };
});

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

function mockLists(
  lists: Array<{ id: string; name: string; role: string; visibility?: string }> = [
    { id: "list-1", name: "Paris", role: "OWNER", visibility: "PRIVATE" },
    { id: "list-2", name: "Shared", role: "VIEWER", visibility: "SHARED" },
  ]
) {
  vi.mocked(useLists).mockReturnValue({
    data: {
      lists,
      pagination: { page: 1, limit: 100, total: lists.length, totalPages: 1 },
    },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLists>);
}

function listNativeSelect() {
  const combobox = screen.getByRole("combobox", { name: "fields.list" });
  const item = combobox.closest('[data-slot="form-item"]');
  return item?.querySelector("select") as HTMLSelectElement;
}

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
    mockLists();
  });

  it("shows validation messages for required fields without lat/lng inputs", async () => {
    const user = userEvent.setup();

    render(<CreatePoiForm coordinates={coordinates} listId="list-1" closeDialog={closeDialog} />);

    await user.click(screen.getByRole("button", { name: "create.submit" }));

    expect(await screen.findByText("validation.requiredName")).toBeInTheDocument();
    expect(screen.queryByText("validation.latitudeInvalid")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("fields.latitude")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("fields.longitude")).not.toBeInTheDocument();
    expect(createPoi).not.toHaveBeenCalled();
    expect(uploadPoiPhoto).not.toHaveBeenCalled();
  });

  it("hides the list field when a list is already selected", () => {
    render(<CreatePoiForm coordinates={coordinates} listId="list-1" closeDialog={closeDialog} />);

    expect(screen.queryByLabelText("fields.list")).not.toBeInTheDocument();
  });

  it("shows a list picker and only editable lists when no list is selected", () => {
    render(<CreatePoiForm coordinates={coordinates} closeDialog={closeDialog} />);

    expect(screen.getByRole("combobox", { name: "fields.list" })).toBeInTheDocument();
    const optionLabels = [...listNativeSelect().options].map((option) => option.textContent);
    expect(optionLabels).toContain("Paris");
    expect(optionLabels).not.toContain("Shared");
  });

  it("requires a list when none is preselected", async () => {
    const user = userEvent.setup();

    render(<CreatePoiForm coordinates={coordinates} closeDialog={closeDialog} />);

    await user.type(screen.getByLabelText("fields.name"), "Secret spot");
    await user.click(screen.getByRole("button", { name: "create.submit" }));

    expect(await screen.findByText("validation.requiredList")).toBeInTheDocument();
    expect(createPoi).not.toHaveBeenCalled();
  });

  it("adds the created POI to the list picked in the form", async () => {
    const user = userEvent.setup();

    render(<CreatePoiForm coordinates={coordinates} closeDialog={closeDialog} />);

    await user.type(screen.getByLabelText("fields.name"), "Secret spot");
    await user.selectOptions(listNativeSelect(), "list-1");
    await user.click(screen.getByRole("button", { name: "create.submit" }));

    await waitFor(() => {
      expect(createPoi).toHaveBeenCalled();
      expect(addPoiToList).toHaveBeenCalledWith({
        listId: "list-1",
        body: { poiId: "poi-1" },
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      "addPoi.success",
      expect.objectContaining({
        action: expect.objectContaining({ label: "addPoi.viewList" }),
      })
    );
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when there is no editable list", () => {
    mockLists([{ id: "list-2", name: "Shared", role: "VIEWER", visibility: "SHARED" }]);

    render(<CreatePoiForm coordinates={coordinates} closeDialog={closeDialog} />);

    expect(screen.getByText("create.listEmpty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "create.submit" })).toBeDisabled();
  });

  it("submits createPoi with map coordinates when no photo is selected", async () => {
    const user = userEvent.setup();

    render(<CreatePoiForm coordinates={coordinates} listId="list-1" closeDialog={closeDialog} />);

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
    expect(addPoiToList).toHaveBeenCalledWith({
      listId: "list-1",
      body: { poiId: "poi-1" },
    });
    expect(toast.success).toHaveBeenCalledWith("addPoi.success");
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });

  it("uploads the photo then creates the POI with photoUrls", async () => {
    const user = userEvent.setup();
    const file = new File(["photo"], "spot.webp", { type: "image/webp" });

    render(<CreatePoiForm coordinates={coordinates} listId="list-1" closeDialog={closeDialog} />);

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

    render(<CreatePoiForm coordinates={coordinates} listId="list-1" closeDialog={closeDialog} />);

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
