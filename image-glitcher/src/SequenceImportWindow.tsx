import React, { RefObject, createRef, useRef } from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM, { findDOMNode } from 'react-dom';
import { Button, responsiveFontSizes } from '@material-ui/core';
import JSZip from 'jszip';
import { Util } from './Util';
import ArrowExpand from './icons/arrow-expand.svg';
import { ImageProcessorWindow } from './ImageProcessorWindow';
import { ImageProcessor, AmpModSettings, ImageProcessorSettings, DelaySettings, ShuffleSettings } from './ImageProcessor';
import { IconButton } from './IconButton';
import Jimp from 'jimp';

interface SequenceImportProps
{
    frameSequence : Uint8Array[],
    processedFrameSequence : Blob[]
}

interface SequenceImportState
{
    isSequenceLoading : boolean,
    isImageConverting : boolean,
    sequencePreviewUrl : string,
    frameImportCounter : number,
    totalFrames : number
}

export class SequenceImportWindow extends React.Component<SequenceImportProps, SequenceImportState>
{
    state = { isSequenceLoading: false, isImageConverting: false, sequencePreviewUrl: "", frameImportCounter: 0, totalFrames: 0 };
    
    fileInput = createRef<HTMLInputElement>();

    render()
    {
        let buttonsContainerStyle = Styles.alignRight;
        buttonsContainerStyle.marginTop = "16px";

        let processButtonContainerStyle : React.CSSProperties = 
        {
            display: this.state.isSequenceLoading ? "none" : "inline-block"
        };

        let sequenceLoadingText = this.state.isSequenceLoading ? <h2 style={Styles.h2Style}>Loading image {this.state.frameImportCounter}/{this.state.totalFrames}</h2> : "";
        let sequenceConvertingText = this.state.isImageConverting ? <h2 style={Styles.h2Style}>Converting images to .bmp</h2> : "";

        return (
            <div style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>Sequence Import</h1>
                <input ref={this.fileInput} type="file" onChange={() => this.importImageSequence()} multiple />
                <img src={this.state.sequencePreviewUrl} style={Styles.imageStyle}/>
                {sequenceLoadingText}
                {sequenceConvertingText}
                
                <div style={buttonsContainerStyle}>
                    {/* 
                    <div style={processButtonContainerStyle}>
                        <IconButton iconName="process" hint="Process" onClick={async () => await this.processFrameSequence()}/>
                    </div>
                    */}
                    <IconButton leftMargin iconName="download" hint="Download frames" onClick={async () => await Util.downloadFrameSequence(this.props.frameSequence)}/>
                </div>
                
            </div>
        );
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
/*
    async processFrameSequence()
    {
        if(!this.props.frame) 
        {
            alert("No frame loaded in the inspector!");
            return;
        }

        this.setState({ isSequenceRendering: true });
        await ImageProcessor.instance.processFrameSequence(this.props.frameSequence, this.props.frame.settings, this.props.encodingAlgorithm, count => this.setState({ frameRenderCounter: count }));
        this.setState({ isSequenceRendering: false });
    }
*/
    /*
    async downloadProcessedFrameSequence()
    {
        let zip = new JSZip();

        console.log('processed frame sequence', this.props.processedFrameSequence)

        //each zip files contains 10 frames to avoid memory overflow
        let tenFramesCounter = 0;
        for (let i = 0; i < this.props.processedFrameSequence.length; i++) 
        {
            const frame = this.props.processedFrameSequence[i];
            zip.file(Util.getFrameName(i), frame);

            tenFramesCounter++;
            if(tenFramesCounter > 9)
            {
                tenFramesCounter = 0;

                //split to a new zip file every 10 frames
                let content = await zip.generateAsync({ type:"blob" });

                //see FileSaver.js
                saveAs(content, "FrameSequence.zip");

                zip = new JSZip();
            }
        }

        if(zip.length > 0)
        {
            let content = await zip.generateAsync({ type:"blob" });

            //see FileSaver.js
            saveAs(content, "FrameSequence.zip");
        }
    }
    */
}
