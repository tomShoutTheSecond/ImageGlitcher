import React, { RefObject, createRef, useRef } from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM, { findDOMNode } from 'react-dom';
import { Button } from '@material-ui/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
    isSequenceConverting : boolean,
    isSequenceLoading : boolean,
    sequencePreviewUrl : string,
    frameImportCounter : number,
    totalFrames : number
}

export class SequenceImportWindow extends React.Component<SequenceImportProps, SequenceImportState>
{
    state = { isSequenceConverting: false, isSequenceLoading: false, sequencePreviewUrl: "", frameImportCounter: 0, totalFrames: 0 };
    
    fileInput = createRef<HTMLInputElement>();

    render()
    {
        let buttonsContainerStyle = Styles.alignRight;
        buttonsContainerStyle.marginTop = "16px";

        let processButtonContainerStyle : React.CSSProperties = 
        {
            display: this.state.isSequenceLoading || this.state.isSequenceConverting ? "none" : "inline-block"
        };

        let sequenceLoadingText = this.state.isSequenceLoading ? <h2 style={Styles.h2Style}>Loading image {this.state.frameImportCounter}/{this.state.totalFrames}</h2> : "";
        let sequenceConvertingText = this.state.isSequenceConverting ? "Converting to .bmp" : "";

        console.log("sequenceLoadingText: " + sequenceLoadingText);

        return (
            <div style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>Sequence Import</h1>
                <input ref={this.fileInput} type="file" onChange={() => this.importImageSequence()} multiple />
                <img src={this.state.sequencePreviewUrl} style={Styles.imageStyle}/>
                {sequenceLoadingText}
                {sequenceConvertingText}
                {/*
                <div style={buttonsContainerStyle}>
                    <div style={processButtonContainerStyle}>
                        <IconButton iconName="process" hint="Process" onClick={async () => await this.processFrameSequence()}/>
                    </div>
                    <IconButton leftMargin iconName="download" hint="Download frames" onClick={async () => await this.downloadProcessedFrameSequence()}/>
                </div>
                */}
            </div>
        );
    }

    importImageSequence()
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

        this.loadImageFromFile(imageFiles[0]);
    }

    convertNextFrame()
    {
        let imageFiles = this.fileInput.current!.files;
        if (!imageFiles)
        {
            alert("Image file not found");
            return;
        }

        this.setState({ frameImportCounter: this.state.frameImportCounter + 1 });

        console.log(imageFiles.length.toString() + " files in total");
        console.log("Importing frame " + this.state.frameImportCounter);

        if(this.state.frameImportCounter > imageFiles.length - 1)
        {
            //TODO: find out why this isn't working for bmp files
            console.log("Hiding counter label");
            this.setState({ isSequenceConverting: false, isSequenceLoading: false });
            console.log("isSequenceLoading: " + this.state.isSequenceLoading);
            return;
        } 

        this.loadImageFromFile(imageFiles[this.state.frameImportCounter]);
    }

    loadImageFromFile(imageFile : File)
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
                State.addFrameToSequence(rawData);

                this.convertNextFrame();
            }

            //put preview in component
            fileReader.readAsDataURL(imageFile);

            fileReader.onloadend = () =>
            {
                let originalImageUrl = fileReader.result as string;

                this.setState({ isSequenceLoading: true });

                if(!imageIsBitmap)
                {
                    this.setState({ isSequenceConverting: true });
                    Util.convertImage(originalImageUrl, imageBlob => this.loadConvertedImage(imageBlob));
                }
                else
                {
                    this.setState({ sequencePreviewUrl: originalImageUrl });
                }
            }
        }
    }

    loadConvertedImage(imageBlob : Blob)
    {
        let fileReader = new FileReader();

        //set image data
        fileReader.onloadend = () =>
        {
            let result = fileReader.result as ArrayBuffer;
            let convertedImageData = new Uint8Array(result);
            State.addFrameToSequence(convertedImageData);

            this.convertNextFrame();

            //show converted image in preview
            URL.revokeObjectURL(this.state.sequencePreviewUrl);
            let convertedImageUrl = window.URL.createObjectURL(imageBlob);
            this.setState({ sequencePreviewUrl: convertedImageUrl });

            console.log("Converted image was loaded");
        }
        fileReader.readAsArrayBuffer(imageBlob);
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
