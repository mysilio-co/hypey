import React, { useEffect, useRef, useState } from 'react';

import { fetch } from '@inrupt/solid-client-authn-browser'
import { saveFileInContainer, getSourceUrl } from '@inrupt/solid-client'
import Cropper from 'react-cropper';
//import newBlobReducer from 'image-blob-reduce'

import { Loader } from './elements';

const ImageEditingModule = ({ src, onSave, onClose, ...props }) => {
  const [saving, setSaving] = useState()
  const cropperRef = useRef()
  const save = async () => {
    setSaving(true)
    await onSave(cropperRef.current.cropper.getCroppedCanvas())
    setSaving(false)
  }
  return (
    <div className="p-4" onClose={onClose} {...props}>
      <Cropper
        ref={cropperRef}
        src={src}
        autoCropArea={1}
        viewMode={1}
        crossOrigin="use-credentials"
        className="h-96"
      />
      <div className="flex flex-row p-6 justify-center">
        <button className="btn-inset btn-md mr-3" onClick={() => {
          cropperRef.current.cropper.rotate(90)
        }}>
          rotate
        </button>
        {saving ? (
          <Loader />
        ) : (
          <>
            <button className="btn-inset btn-md mr-3" onClick={save}>
              done editing
            </button>
            <button className="btn-inset btn-md" onClick={onClose}>
              cancel
            </button>
          </>
        )}
      </div>
    </div >
  )
}

const uploadToContainerFromCanvas = (canvas, containerUri, type, name) => new Promise((resolve, reject) => {
  canvas.toBlob(async (blob) => {
    // uncomment if we find we need blob scaling
    //    console.log("scaling blob")
    //    const scaledBlob = await newBlobReducer().toBlob(blob, {max: 600})
    //    console.log("scaled blob")
    try {
      const savedFile = await saveFileInContainer(containerUri, blob, { contentType: type, fetch, slug: name })
      resolve(savedFile)
    } catch (e) {
      console.log("image upload failed: ", e)
      reject(e)
    }
  }, type, 1)

})

function UploadFileButton({ onFileChanged, ...rest }) {
  const inputRef = useRef()
  return (
    <>
      <button {...rest} onClick={() => inputRef.current.click()} />
      <input
        ref={inputRef}
        accept="image/*"
        style={{ display: 'none' }}
        type="file"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          onFileChanged(f);
        }}
      />
    </>
  )
}

export default function ImageUploader({ onSave, onClose, imageUploadContainerUrl, buttonContent = "pick an image" }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [originalSrc, setOriginalSrc] = useState()
  const [previewSrc, setPreviewSrc] = useState()
  const [croppedCanvas, setCroppedCanvas] = useState()

  const [file, setFile] = useState()
  const onFileChanged = (file) => {
    setFile(file);
  };

  useEffect(() => {
    let objectUrl;
    if (file) {
      objectUrl = URL.createObjectURL(file)
      setOriginalSrc(objectUrl)
      setPreviewSrc(objectUrl)
      setEditing(true)
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [file])

  async function save() {
    setSaving(true)
    const savedFile = await uploadToContainerFromCanvas(croppedCanvas, imageUploadContainerUrl, file.type, file.name)
    const newImageUrl = getSourceUrl(savedFile)
    onSave && await onSave(newImageUrl, file);
    setSaving(false)
    setEditing(false)
    setFile(null)
    setOriginalSrc(null)
    setPreviewSrc(null)
    setCroppedCanvas(null)
  }

  return (
    <>
      {editing ? (
        <ImageEditingModule open={editing} src={originalSrc}
          onClose={onClose}
          onSave={async (canvas) => {
            setPreviewSrc(canvas.toDataURL(file.type))
            setCroppedCanvas(canvas)
            setEditing(false)
          }} />

      ) : saving ? (
        <Loader />
      ) : (
        <div className="flex flex-col h-96">
          {previewSrc && (
            <div className="flex flex-row justify-center items-center flex-grow">
              <img src={previewSrc} className="h-32 object-contain" alt="your new profile" />
            </div>
          )}
          <div className="flex flex-row justify-center items-center flex-grow-0 p-6">
            <UploadFileButton className="btn-md btn-transparent mr-3" onFileChanged={onFileChanged}>
              {buttonContent}
            </UploadFileButton>
            {croppedCanvas &&
              <>
                <button className="btn-md btn-floating btn-square mr-3" onClick={() => setEditing(true)}>
                  edit
                </button>
                <button className="btn-md btn-floating btn-square mr-3" onClick={save} disabled={saving}>
                  save
                </button>
              </>
            }
            {onClose && (
              <button className="btn-md btn-transparent btn-square mr-3 text-gray-700"
                onClick={() => onClose && onClose()}>
                cancel
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
