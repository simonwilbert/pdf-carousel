"use client";

import { v4 as uuidv4 } from "uuid";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { CiCircleRemove } from "react-icons/ci";
import { twMerge } from "tailwind-merge";
import { sendGAEvent } from "@next/third-parties/google";

export type File = {
  id: string;
  name: string;
  content: string;
  size: number;
  width: number;
  height: number;
  type: string;
};

const Files = () => {
  const fileDropRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<FileList>();

  const [status, setStatus] = useState("");
  const [items, setItems] = useState<File[]>([]);
  const [draggingItem, setDraggingItem] = useState<File | null>();
  const [newFilesDraggedOver, setNewFilesDraggedOver] =
    useState<boolean>(false);

  function showClass(element: HTMLLIElement, className: string) {
    if (!element.classList.contains(className)) {
      element.classList.add(className);
    }
  }

  function removeClass(element: HTMLLIElement, className: string) {
    if (element.classList.contains(className)) {
      element.classList.remove(className);
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, item: File) => {
    setDraggingItem(item);
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragEnd = () => setDraggingItem(null);

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    showClass(e.target as HTMLLIElement, "border-b");
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) =>
    removeClass(e.target as HTMLLIElement, "border-b");

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetItem: File) => {
    removeClass(e.target as HTMLLIElement, "border-b");

    if (!draggingItem) return;

    const newItems = [...items];
    const currentIndex = newItems.indexOf(draggingItem);
    const targetIndex = newItems.indexOf(targetItem);

    if (currentIndex !== -1 && targetIndex !== -1) {
      newItems.splice(currentIndex, 1);
      newItems.splice(targetIndex, 0, draggingItem);
      setItems(newItems);
    }
  };

  const handleFilesDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newFilesDraggedOver) {
      setNewFilesDraggedOver(true);
    }
  };

  const handleFilesDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();

    if (newFilesDraggedOver) {
      setNewFilesDraggedOver(false);
    }
  };

  const handleFilesDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // @ts-expect-error to fix
    setSelectedFiles([...e.dataTransfer.files]);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) =>
    // @ts-expect-error to fix
    setSelectedFiles([...(e.target.files as FileList)]);

  useEffect(() => {
    const addFiles = () => {
      for (const file of selectedFiles || []) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const image = new Image();
          image.src = event.target?.result as string;
          image.onload = function () {
            console.log("onload", event.target);
            setItems((prevState: File[]) => [
              ...prevState,
              {
                id: uuidv4(),
                name: file.name,
                size: Number(file.size),
                content: (event.target?.result as string) ?? "",
                // @ts-expect-error to fix
                width: this.width,
                // @ts-expect-error to fix
                height: this.height,
                type: file.type,
              },
            ]);
          };
        };
        reader.readAsDataURL(file);
      }
    };

    if (selectedFiles && selectedFiles.length > 0) {
      addFiles();
    }
  }, [selectedFiles]);

  const deleteItem = (id: string) =>
    setItems((prevState: File[]) => prevState.filter((item) => item.id !== id));

  const generatePDF = () => {
    sendGAEvent("event", "generatePDF", {
      fileCount: items.length,
      maxWidth: items.reduce((max, item) => Math.max(max, item.width), 0),
      maxHeight: items.reduce((max, item) => Math.max(max, item.height), 0),
      types: [
        ...new Set(
          items.map((item) => item?.type?.toLowerCase()).filter(Boolean)
        ),
      ]
        .sort()
        .join(","),
    });

    setStatus("Generating...");

    const doc = new jsPDF({
      compress: true,
      unit: "px",
    });
    doc.deletePage(1);
    doc.setFontSize(60);

    for (let i = 0; i < items.length; i++) {
      const { width, height, content } = items[i];

      doc.addPage([width, height], width > height ? "landscape" : "portrait");

      doc.addImage(
        content,
        "JPEG",
        0,
        0,
        width,
        height,
        undefined,
        "MEDIUM",
        0
      );
      setStatus(`Processed ${i} of ${items.length}`);
    }

    doc.save("my_images.pdf");
    setStatus("Finished");
    setTimeout(() => setStatus(""), 2000);
  };

  const bytesToSize = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = Math.round(Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <>
      <label
        htmlFor="dropzone-file"
        className={twMerge(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600",
          newFilesDraggedOver ? "bg-grey-400" : "transparent"
        )}
        onDragOver={handleFilesDragOver}
        onDragLeave={handleFilesDragLeave}
        onDrop={handleFilesDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full">
          <svg
            className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            SVG, PNG, JPG or GIF (MAX. 800x400px)
          </p>
        </div>
        <input
          id="dropzone-file"
          type="file"
          multiple
          className="hidden"
          ref={fileDropRef}
          onChange={onFileChange}
        />
      </label>

      <ul className="block list-decimal list-inside">
        {items.map((item: File) => (
          <li
            key={item.id}
            className={`my-1 py-1 px-2 bg-gray-100 border-l border-black item flex w-full items-center hover:bg-sky-700 ${
              item === draggingItem ? "dragging" : ""
            }`}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item)}
          >
            <div className="w-[40px] mr-4">
              <img
                src={decodeURIComponent(item.content)}
                className="h-[40px]"
                alt={item.name}
              />
            </div>
            <div
              className="grow text-ellipsis"
              title={`${item.name} (${item.size})`}
            >
              <span className="mr-2 select-none pointer-events-none">
                {item.name}
              </span>
              <span className="text-sm text-gray-400">
                {bytesToSize(item.size)} - {item.type}
              </span>
            </div>
            <div className="pl-2" onClick={() => deleteItem(item.id)}>
              <CiCircleRemove size={25} />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-4 items-center flex-col w-full">
        <button
          className={twMerge(
            "rounded-lg px-4 py-2 bg-black text-white",
            status.length > 0 ? "bg-grey" : ""
          )}
          onClick={generatePDF}
        >
          Generate PDF
        </button>
      </div>
      {status && (
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center">
          {status}
        </div>
      )}
    </>
  );
};

export default Files;
