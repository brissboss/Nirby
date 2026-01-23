import { uploadAvatar } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function useUpload() {
  const { refresh } = useAuth();

  const uploadUserAvatar = async (file: File) => {
    const response = await uploadAvatar({
      body: {
        file,
      },
    });

    if (response.data) {
      await refresh();
      return response.data;
    }
    throw response.error;
  };

  return { uploadUserAvatar };
}
