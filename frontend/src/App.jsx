import { useRef, useState } from "react";

export default function App() {
    const [files, setFiles] = useState([]);
    const [format, setFormat] = useState("webp");
    const [quality, setQuality] = useState(80);
    const [dragging, setDragging] = useState(false);
    const [converting, setConverting] = useState(false);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    const showToast = message => {
        setToast(message);
        setTimeout(() => setToast(null), 3500);
    };

    const handleFiles = incoming => {
        setFiles(prev => [...prev, ...Array.from(incoming)]);
    };

    const removeFile = index => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const convert = async () => {
        if (!files.length) return;
        setConverting(true);

        try {
            const form = new FormData();
            files.forEach(f => form.append("images", f));
            form.append("format", format);
            form.append("quality", String(parseInt(quality, 10)));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/convert`, {
            method: "POST",
            body: form,
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "converted.zip";
            a.click();

            showToast("Download started");
        } catch (err) {
            console.error(err);
            showToast("Conversion failed. Try again.");
        } finally {
            setConverting(false);
        }
        };


    const totalSize = files.reduce((a, b) => a + b.size, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex justify-center p-6">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-5xl space-y-6">

                <header className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                    <div>
                        <h1 className="text-2xl font-semibold leading-tight">Image Converter</h1>
                        <p className="text-sm text-gray-500">Fast batch image conversion with previews</p>
                    </div>
                    <div className="text-sm text-gray-600 sm:text-right text-left">Ready</div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: controls / drop area */}
                    <div>
                        <div
                            onDragEnter={() => setDragging(true)}
                            onDragLeave={() => setDragging(false)}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                setDragging(false);
                                handleFiles(e.dataTransfer.files);
                            }}
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition select-none min-h-[160px]
                                ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
                        >
                            <p className="text-gray-700 font-medium">Drag & drop images here</p>
                            <p className="text-sm text-gray-400 mt-1">or</p>

                            <div className="mt-3 flex flex-col sm:flex-row gap-3 justify-center w-full">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 w-full sm:w-auto"
                                >
                                    Select files
                                </button>

                                <button
                                    onClick={() => setFiles([])}
                                    disabled={!files.length}
                                    className="px-4 py-2 bg-red-50 text-red-600 border rounded disabled:opacity-50 w-full sm:w-auto"
                                >
                                    Clear
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={e => handleFiles(e.target.files)}
                            />
                        </div>

                        <div className="mt-4 bg-gray-50 border rounded p-4">
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                                <div className="flex flex-col w-full min-w-0 gap-3">
                                    <div className="w-full">
                                        <select
                                            className="border rounded px-3 py-2 w-full sm:min-w-[140px]"
                                            value={format}
                                            onChange={e => setFormat(e.target.value)}
                                            aria-label="Output format"
                                        >
                                            <option value="webp">WebP</option>
                                            <option value="avif">AVIF</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 w-full min-w-0 overflow-hidden">
                                        <span className="text-sm shrink-0">Quality</span>
                                        <input
                                            className="w-full max-w-full appearance-none h-3"
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={quality}
                                            onChange={e => setQuality(e.target.value)}
                                            aria-label="Quality"
                                        />
                                        <span className="text-sm w-10 text-right flex-shrink-0">{quality}</span>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-600 sm:text-right text-left">
                                    {files.length} files • {(totalSize / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </div>

                            <button
                                disabled={!files.length || converting}
                                onClick={convert}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg transition flex items-center justify-center gap-3"
                            >
                                {converting && <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 100 24v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path></svg>}
                                Convert {files.length ? `${files.length} Image${files.length>1?"s":""}` : ''}
                            </button>
                        </div>
                    </div>

                    {/* Right: preview */}
                    <div className="md:col-span-2">
                        {files.length === 0 ? (
                            <div className="border border-dashed rounded-xl p-8 text-center text-gray-400">
                                No images selected — previews will appear here
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {files.map((file, i) => (
                                    <div key={i} className="relative border rounded-lg overflow-hidden group bg-white">
                                        <img src={URL.createObjectURL(file)} className="h-28 sm:h-40 w-full object-cover" alt={file.name} />

                                        <button
                                            onClick={() => removeFile(i)}
                                            aria-label={`Remove ${file.name}`}
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center flex"
                                        >
                                            ×
                                        </button>

                                        <div className="p-2 text-xs max-w-full">
                                            <div className="truncate font-medium max-w-full">{file.name}</div>
                                            <div className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <div className="fixed sm:right-6 sm:bottom-6 bottom-4 left-4 right-4 sm:left-auto bg-black text-white px-4 py-2 rounded shadow-lg max-w-md mx-auto text-center sm:text-left">
                        {toast}
                    </div>
                )}

            </div>
        </div>
    );
}