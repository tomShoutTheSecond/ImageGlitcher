import React, { RefObject, createRef, useRef } from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM, { findDOMNode } from 'react-dom';
import { Button, Card, responsiveFontSizes } from '@material-ui/core';
import JSZip from 'jszip';
import { Util } from './Util';
import ArrowExpand from './icons/arrow-expand.svg';
import { ImageProcessorWindow } from './ImageProcessorWindow';
import { ImageProcessor, AmpModSettings, ImageProcessorSettings, DelaySettings, ShuffleSettings } from './ImageProcessor';
import { IconButton } from './IconButton';
import Jimp from 'jimp';

interface SequenceImportProps
{
    frameSequence : Uint8Array[]
}

interface SequenceImportState
{
    isSequenceLoading : boolean,
    isImageConverting : boolean,
    isDownloading : boolean,
    sequencePreviewUrl : string,
    frameImportCounter : number,
    totalFrames : number
}

export class SequenceImportWindow extends React.Component<SequenceImportProps, SequenceImportState>
{
    state = { isSequenceLoading: false, isImageConverting: false, isDownloading: false, sequencePreviewUrl: "", frameImportCounter: 0, totalFrames: 0 };
    
    fileInput = createRef<HTMLInputElement>();

    render()
    {
        let loadingTextStyle = Styles.h2Style;
        loadingTextStyle.marginTop = "12px";
        let sequenceLoadingText = this.state.isSequenceLoading ? <h2 style={loadingTextStyle}>Loading image {this.state.frameImportCounter}/{this.state.totalFrames}</h2> : "";
        let sequenceConvertingText = this.state.isImageConverting ? <div>Converting images to .bmp</div> : "";

        return (
            <Card style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>Load Images</h1>
                <input style={{ display: "none" }} ref={this.fileInput} type="file" onChange={() => this.importImageSequence()} multiple />
                <img src={this.state.sequencePreviewUrl} style={Styles.imageStyle}/>
                {sequenceLoadingText}
                {sequenceConvertingText}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", margin: "16px" }}>
                    <div>
                        {this.props.frameSequence.length} images
                    </div>
                    <div>
                        <IconButton leftMargin iconName="plus" hint="Import images" onClick={() => this.openFilePicker()}/>
                        <IconButton leftMargin iconName="download" hint="Download images" onClick={async () => await this.downloadFrames()} loading={this.state.isDownloading}/>
                    </div>
                </div>
            </Card>
        );
    }

    openFilePicker()
    {
        this.fileInput.current?.click();
    }

    async importImageSequence()
    {
        if (!this.fileInput.current) return;
        let imageFiles = this.fileInput.current.files;

        if (!imageFiles || imageFiles.length == 0)
        {
            alert("Image file not found");
            return;
        }

        State.clearFrameSequence();
        State.clearProcessedFrameSequence();
        this.setState({ frameImportCounter: 0, totalFrames: imageFiles.length });

        await this.loadImagesFromFile(imageFiles);
    }

    async loadImagesFromFile(fileList : FileList)
    {
        this.setState({ isSequenceLoading: true });

        let imageFiles = Array.from(fileList);
        for(let file of imageFiles)
        {
            let imageData = await this.loadImageFileAsBitmap(file);
            State.addFrameToSequence(imageData);

            //show image in preview
            URL.revokeObjectURL(this.state.sequencePreviewUrl);
            let previewImageUrl = window.URL.createObjectURL(new Blob([imageData]));
            this.setState({ sequencePreviewUrl: previewImageUrl, frameImportCounter: this.state.frameImportCounter + 1 });
        }

        this.setState({ isSequenceLoading: false, isImageConverting: false });
    }

    async loadImageFileAsBitmap(imageFile : File)
    {
        return new Promise<Uint8Array>((resolve, reject) => 
        {
            let imageIsBitmap = imageFile.name.endsWith(".bmp");
            
            let fileReader = new FileReader();
            fileReader.readAsArrayBuffer(imageFile);
            fileReader.onloadend = () =>
            {
                //get data from file (if bitmap was supplied)
                if(imageIsBitmap)
                {
                    let result = fileReader.result as ArrayBuffer;
                    let rawData = new Uint8Array(result);
                    resolve(rawData);
                    return;
                }

                //convert non-bitmap images and return them as bitmap
                this.setState({ isImageConverting: true });

                fileReader.onloadend = async () =>
                {
                    let originalImageUrl = fileReader.result as string;
                    let convertedImage = await Util.convertImage(originalImageUrl);
                    let image = await this.loadImageFromBlob(convertedImage);
                    resolve(image);
                    return;
                }
                fileReader.readAsDataURL(imageFile);
            }
            fileReader.onerror = e => reject(e);
        });
    }

    async loadImageFromBlob(imageBlob : Blob)
    {
        return new Promise<Uint8Array>((resolve, reject) => 
        {
            let fileReader = new FileReader();

            //set image data
            fileReader.onloadend = () =>
            {
                let result = fileReader.result as ArrayBuffer;
                let convertedImageData = new Uint8Array(result);
                resolve(convertedImageData);
                return;
            }
            fileReader.onerror = e => reject(e);
            fileReader.readAsArrayBuffer(imageBlob);
        });
    }

    async downloadFrames()
    {
        this.setState({ isDownloading: true });
        await Util.downloadFrameSequence(this.props.frameSequence)
        this.setState({ isDownloading: false });
    }
}
