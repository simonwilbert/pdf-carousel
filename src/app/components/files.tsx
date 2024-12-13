"use client";

import { v4 as uuidv4 } from "uuid";
import { useRef, useState } from "react";
import { jsPDF } from "jspdf";

export type File = {
  id: string;
  name: string;
  content: string;
  size: number;
  width: number;
  height: number;
};

const Files = () => {
  const fileInput = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState("");
  const [items, setItems] = useState<File[]>([]);
  const [draggingItem, setDraggingItem] = useState(null);

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

  const handleDragStart = (
    e: React.DragEvent<HTMLLIElement>,
    item: HTMLLIElement
  ) => {
    // @ts-expect-error to fix
    setDraggingItem(item);
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    showClass(e.target as HTMLLIElement, "border-b");
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
    removeClass(e.target as HTMLLIElement, "border-b");
    // @ts-expect-error to fix
    e.target.style.backgroundColor = "transparent";
  };

  const handleDrop = (
    e: React.DragEvent<HTMLLIElement>,
    targetItem: HTMLLIElement
  ) => {
    removeClass(e.target as HTMLLIElement, "border-b");
    if (!draggingItem) return;
    const newItems = [...items];
    const currentIndex = newItems.indexOf(draggingItem);
    // @ts-expect-error to fix
    const targetIndex = newItems.indexOf(targetItem);
    if (currentIndex !== -1 && targetIndex !== -1) {
      newItems.splice(currentIndex, 1);
      newItems.splice(targetIndex, 0, draggingItem);
      setItems(newItems);
    }
  };

  const addNewItem = () => {
    for (const file of fileInput.current?.files || []) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const image = new Image();
        image.src = event.target?.result as string;
        image.onload = function () {
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
            },
          ]);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const createPDF = () => {
    setStatus("Starting...");
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
    setTimeout(() => setStatus(""), 5000);
  };

  return (
    <>
      <div className="new-item">
        <input
          ref={fileInput}
          type="file"
          className="bg-gray-100 mx-4 my-2"
          multiple
        />
        <button onClick={addNewItem} className="add-button">
          Add New File
        </button>
      </div>
      <ul className="block list-decimal list-inside">
        {items.map((item: File) => (
          <li
            key={item.id}
            className={`my-1 py-1 px-2 bg-gray-100 border-l border-black item ${
              item === draggingItem ? "dragging" : ""
            }`}
            draggable="true"
            onDragStart={(e) => {
              // @ts-expect-error to fix
              handleDragStart(e, item);
            }}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              // @ts-expect-error to fix
              handleDrop(e, item);
            }}
          >
            {item.name} ({item.size})
          </li>
        ))}
      </ul>

      <div className="flex gap-4 items-center flex-col w-full">
        <button
          className="rounded-lg px-4 py-2 bg-black text-white"
          onClick={() => createPDF()}
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
