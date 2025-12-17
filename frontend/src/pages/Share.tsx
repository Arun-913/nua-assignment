import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function Share() {
  const { id } = useParams<{ id: string }>();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    async function checkLogin() {
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/check-login`, { withCredentials: true });
        fetchFile();
      } catch (error) {
        navigate('/signin');
      }
    }

    const fetchFile = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/share/${id}`,
          {
            responseType: "blob",
            withCredentials: true,
          }
        );

        const blob = response.data as Blob;
        const url = URL.createObjectURL(blob);

        setFileUrl(url);
        setMimeType(blob.type);

        if (
          !blob.type.startsWith("image/") &&
          blob.type !== "application/pdf"
        ) {
          const link = document.createElement("a");
          link.href = url;
          link.download = "download";
          link.click();
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error(error);
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error || "File access denied");
          return;
        }
        toast.error("Error while fetching file");
      }
    };

    checkLogin()

    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [id]);

  if (!fileUrl) {
    return <div className="p-6 text-center">Loading file…</div>;
  }

  if (mimeType?.startsWith("image/")) {
    return (
      <div className="p-6 flex justify-center">
        <img src={fileUrl} alt="Shared file" className="max-w-full rounded" />
      </div>
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <div className="w-full h-screen">
        <iframe
          src={fileUrl}
          title="PDF Preview"
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <p>File downloaded</p>
    </div>
  );
}
