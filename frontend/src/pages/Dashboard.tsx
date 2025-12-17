import { useState, type DragEvent, type ChangeEvent, useEffect, useRef } from 'react';
import Tabs from '@/components/ui/Tabs';
import { Upload, File, Trash2, Download, Share2, Copy, } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { AvatarDropdown } from '@/components/ui/AvatarDropDown';

type UploadedFile = {
  id: string;
  name: string;
  size: string;
  date: string;
  type: string;
};

type User = {
  name: string;
  email: string;
  id: string
}

type Options = {
  label: string;
  value: string;
}


export default function Dashboard() {
  const [user, setUser] = useUser();
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [options, setOptions] = useState<Options[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Options[]>([]);
  const [alreadyShared, setAlreadyShared] = useState<User[]>([]);
  const fileRef = useRef<string | null>(null)
  
  const removeOption = (value: any) => {
    setSelectedOptions((prev: any) => prev.filter((v: any) => v !== value));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const getUploadedFile = async() => {
    try {
      const response = (await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/files/dashboard`, { withCredentials: true })).data;
      setFiles(response.map((file: any) => ({
        id: file._id,
        name: file.originalName,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date(file.uploadDate).toISOString().split('T')[0],
        type: file.mimetype.split('/')[0] || 'File',
      })))
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      toast.error("Error while fetching files");
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      const response = (await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/files/upload`, formData, { withCredentials: true })).data;
      setFiles(prev => [...response.files.map((file: any) => ({
        id: file._id,
        name: file.originalName,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date(file.uploadDate).toISOString().split('T')[0],
        type: file.mimetype.split('/')[0] || 'File',
      })), ...prev]);
      setSelectedFiles([]);
      toast.success('Files uploaded successfully!');
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      toast.error("Error while uploading files");
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const deleteFile = async(id: string) => {
    try {
      (await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/files/${id}/delete`, { withCredentials: true, responseType: 'blob' }));
      setFiles(prev => prev.filter(file => file.id !== id));
      toast.success('File deleted successfully!');
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      toast.error("Error while deleting files");
    }
  };

  const handleDownloadFile = async (id: string) => {
    try {
      const response = (await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/files/${id}`, { withCredentials: true, responseType: 'blob' }));
      const blob = response.data;

      const contentDisposition = response.headers['content-disposition'];
      let fileName = "downloaded-file";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match && match[1]) fileName = match[1];
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      toast.error("Error while downloading files");
    }
  }

  const handleCopyFile = async (id: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/share/${id}/share-link`,
        { expiresInHours: 24 },
        { withCredentials: true }
      );

      await navigator.clipboard.writeText(response.data.shareUrl);
      toast.success("Message copied to clipboard");
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      toast.error("Error while copying url");
    }
  };
  
  const handleShareFile = async(id: string) => {
    setModalOpen(true);
    try {
      const [sharedUsers, users] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/share/${id}/users`,{ withCredentials: true }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/users`,{ withCredentials: true })
      ]);

      users.data = users.data.filter((user: any) => !sharedUsers.data.find((sharedUser: any) => sharedUser._id === user._id))
      setOptions(users.data.map((user: any) => ({ label: user.name, value: user._id })));
      setAlreadyShared(sharedUsers.data.map((user: any) => ({ name: user.name, email: user.email, id: user._id })));
      fileRef.current = id;
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      toast.error("Error while fetching users");
    }
  }

  const handleShareFileSubmit = async(id: string) => {
    try {
      if(selectedOptions.length === 0) return;
      const formData = {
        userIds: selectedOptions.map((option: any) => option.value)
      };
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/share/${id}/share-users`, formData, { withCredentials: true });
      setModalOpen(false);
      toast.success(response.data.message);
      setSelectedFiles([]);
      fileRef.current = null;
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      toast.error("Error while sharing files");
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const response = (await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/check-login`, { withCredentials: true })).data;
        setUser(response);
        getUploadedFile();
      } catch (error) {
        navigate('/signin');
      }
    }

    init();
  }, [])

  const handleLogout = async() => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, { withCredentials: true });
      toast.success(response.data.message, {
        duration: 1000,
        onAutoClose: () => navigate('/signin'),
      });
    } catch (error) {
      console.log(error);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Internal server error");
        return;
      }
      toast.error("Error while logout out");
    }
  }

  // Upload Tab content
  const uploadContent = (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload Files</h3>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">Drag and drop files here</p>
        <p className="text-sm text-gray-500 mb-4">or</p>
        <label className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg cursor-pointer hover:from-blue-600 hover:to-purple-700 transition">
          Browse Files
          <input type="file" multiple onChange={handleFileSelect} className="hidden" />
        </label>
        <p className="text-xs text-gray-400 mt-4">Support for multiple files</p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={() => removeSelectedFile(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleUpload} className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition">
            Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
          </button>
        </div>
      )}
    </div>
  );

  // Files Tab content
  const filesContent = (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Uploaded Files</h3>
        <p className="text-sm text-gray-500 mt-1">{files.length} files total</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Type', 'Size', 'Date', 'Actions'].map((header) => (
                <th key={header} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <File className="w-5 h-5 text-blue-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">{file.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{file.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{file.size}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{file.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer"
                      onClick={() => handleDownloadFile(file.id)}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                      onClick={() => handleShareFile(file.id)}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                      onClick={() => handleCopyFile(file.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteFile(file.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {files.length === 0 && (
        <div className="text-center py-12">
          <File className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No files uploaded yet</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <AvatarDropdown
            userName={user?.name.split(' ').map(n => n[0]).join('') || ""}
            items={[{ label: "Logout", onClick: handleLogout }]}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {user?.name}</h2>
          <p className="text-gray-600">Manage your files and uploads</p>
        </div>

        <Tabs
          defaultValue="files"
          tabs={[
            { value: 'files', label: 'My Files', content: filesContent },
            { value: 'upload', label: 'Upload Files', content: uploadContent },
          ]}
        />
      </div>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden z-50">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-2xl font-bold text-gray-900">
                  Access Management
                </Dialog.Title>
                <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X className="w-5 h-5 text-gray-500" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="text-sm text-gray-500 mt-1">
                Select Users
              </Dialog.Description>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="mb-6">
                <Label className='block text-sm font-medium text-gray-700 mb-2'>Select Users</Label>
                <MultiSelect
                  options={options}
                  selected={selectedOptions}
                  onChange={setSelectedOptions}
                  placeholder="Select roles"
                />

                {selectedOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedOptions.map((value, index) => {
                      const option: any = selectedOptions.find(opt => opt === value);
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                        >
                          {option.label}
                          <button
                            onClick={() => removeOption(value)}
                            className="ml-2 hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className='block text-sm font-medium text-gray-700 mb-2'>Already Shared With</div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alreadyShared.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                      </tr>
                    ))}
                    {alreadyShared.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-600">
                          No users shared with
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleShareFileSubmit(fileRef.current!)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
              >
                Save Changes
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
