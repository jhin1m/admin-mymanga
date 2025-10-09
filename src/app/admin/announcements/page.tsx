"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import RichTextEditor from "@/components/form/RichTextEditor";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

interface AlertState {
  show: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

export default function AnnouncementPage() {
  const { token } = useAuth();
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    variant: "info",
    title: "",
    message: "",
  });

  const showAlert = (
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message: string
  ) => {
    setAlert({ show: true, variant, title, message });
    // Auto-hide after 5 seconds for success messages
    if (variant === "success") {
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const response = await apiService.getAnnouncement(token);
        if (response.success && response.data) {
          // Handle null or empty HTML gracefully
          setHtml(response.data.html || "");
        }
      } catch (error: unknown) {
        console.error("Error fetching announcement:", error);
        showAlert(
          "error",
          "Lỗi tải dữ liệu",
          (error as Error).message || "Có lỗi xảy ra khi tải thông báo"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [token]);

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    try {
      const response = await apiService.saveAnnouncement(token, html);
      if (response.success || response.code === 204) {
        showAlert("success", "Thành công", "Đã lưu thông báo thành công!");
      }
    } catch (error: unknown) {
      console.error("Error saving announcement:", error);
      showAlert(
        "error",
        "Lỗi khi lưu",
        (error as Error).message || "Lỗi khi lưu, vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Thông báo" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Thông báo" />

      {alert.show && (
        <div className="mb-6">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}

      <div className="space-y-6">
        <ComponentCard title="Thông báo">
          <div className="space-y-4">
            <RichTextEditor
              value={html}
              onChange={setHtml}
              placeholder="Nhập nội dung thông báo..."
            />

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bạn có thể nhập mã HTML hoặc định dạng văn bản.
            </p>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="min-w-[100px]"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
