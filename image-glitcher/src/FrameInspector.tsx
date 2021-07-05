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

interface FrameInspectorProps
{
    frame : KeyFrame | null,
    imageData : Uint8Array,
    encodingAlgorithm : string,
    frameSequence : Uint8Array[],
    processedFrameSequence : Blob[]
}

interface FrameInspectorState
{
    settings : ImageProcessorSettings,
    sequenceConverting : boolean,
    sequencePreviewUrl : string,
    frameImportCounter : number,
    totalFrames : number
}

export class FrameInspector extends React.Component<FrameInspectorProps, FrameInspectorState>
{
    state = { settings: new ImageProcessorSettings("ampMod", AmpModSettings.default, DelaySettings.default, ShuffleSettings.default), sequenceConverting: false, sequencePreviewUrl: "", frameImportCounter: 0, totalFrames: 0 };
    
    fileInput = createRef<HTMLInputElement>();

    render()
    {
        let containerStyle : React.CSSProperties = 
        {
            margin: "16px",
            padding: "16px",
            verticalAlign: "top",
            background: Colors.background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
            display: "inline-block"
        };

        let numberInputStyle : React.CSSProperties = 
        {
            width: "100px"
        };

        let previewImage = this.props.frame == null ? <p>No image</p> : <img src={this.props.frame.url} style={Styles.imageStyle}/>;
        let ampModSettingsForm = this.props.frame == null ? "" : 
        <div><br/>ampMod
        {
            Object.keys(this.state.settings.ampModSettings).map((settingName, key) => {
                let settingValue = Object.values(this.state.settings.ampModSettings)[key];
                return(
                    <div key={key}>
                        <label htmlFor={settingName}>{settingName}</label> <input onChange={(e) => this.updateSettings(settingName, parseFloat((e.target as HTMLInputElement).value))} style={numberInputStyle} id={settingName} type="number" value={settingValue}/>
                    </div>
                );
            })
        }<br/>delay
        {
            Object.keys(this.state.settings.delaySettings).map((settingName, key) => {
                let settingValue = Object.values(this.state.settings.delaySettings)[key];
                return(
                    <div key={key}>
                        <label htmlFor={settingName}>{settingName}</label> <input onChange={(e) => this.updateSettings(settingName, parseFloat((e.target as HTMLInputElement).value))} style={numberInputStyle} id={settingName} type="number" value={settingValue}/>
                    </div>
                );
            })
        }<br/>shuffle
        {
            Object.keys(this.state.settings.shuffleSettings).map((settingName, key) => {
                let settingValue = Object.values(this.state.settings.shuffleSettings)[key];
                return(
                    <div key={key}>
                        <label htmlFor={settingName}>{settingName}</label> <input onChange={(e) => this.updateSettings(settingName, parseFloat((e.target as HTMLInputElement).value))} style={numberInputStyle} id={settingName} type="number" value={settingValue}/>
                    </div>
                );
            })
        }
        </div>

        let sequenceConvertingText = this.state.sequenceConverting ? <h2>Converting image {this.state.frameImportCounter}/{this.state.totalFrames}</h2> : "";

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Frame Inspector</h1>
                {previewImage}
                {ampModSettingsForm}
                <div style={Styles.alignRight}>
                    <IconButton iconName="image-move" onClick={() => this.renderFrame()}/>
                </div>
                <br/><br/><br/><br/>
                <h2>Sequence import</h2>
                <input ref={this.fileInput} type="file" onChange={() => this.importImageSequence()} multiple />
                <img src={this.state.sequencePreviewUrl} style={Styles.imageStyle}/>
                {sequenceConvertingText}
                <div style={Styles.alignRight}>
                    <IconButton iconName="process" onClick={() => this.processFrameSequence()}/>
                    <IconButton leftMargin iconName="download" onClick={async () => await this.downloadProcessedFrameSequence()}/>
                </div>
            </div>
        );
    }

    renderFrame()
    {
        ImageProcessor.instance.processKeyFrame(this.props.imageData, this.state.settings, this.props.encodingAlgorithm);
    }

    componentWillReceiveProps(nextProps : FrameInspectorProps)
    {
        if(!nextProps.frame) return;

        //update settings when a frame is loaded to the inspector
        this.setState({ settings: nextProps.frame.settings });
    }

    updateSettings(settingName : string, newValue : number)
    {
        let ampModSettings = Util.copy<AmpModSettings>(this.state.settings.ampModSettings);
        let delaySettings = Util.copy<DelaySettings>(this.state.settings.delaySettings);
        let shuffleSettings = Util.copy<ShuffleSettings>(this.state.settings.shuffleSettings);
        switch(settingName)
        {
            case "frequency":
                ampModSettings.frequency = newValue;
                break;
            case "phase":
                ampModSettings.phase = newValue;
                break;
            case "amp":
                ampModSettings.amp = newValue;
                break;
            case "offset":
                ampModSettings.offset = newValue;
                break;
            case "delay":
                delaySettings.delay = newValue;
                break;
            case "feedback":
                delaySettings.feedback = newValue;
                break;
            case "mix":
                delaySettings.mix = newValue;
                break;
            case "segments":
                shuffleSettings.segments = newValue;
                break;
        }

        let settings = new ImageProcessorSettings(this.state.settings.mode, ampModSettings, delaySettings, shuffleSettings);
        this.setState({ settings: settings });
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

        this.setState({ frameImportCounter: this.state.frameImportCounter +1 });

        if(this.state.frameImportCounter > imageFiles.length - 1)
        {
            this.setState({ sequenceConverting: false });
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

                if(!imageIsBitmap)
                {
                    this.setState({ sequenceConverting: true });
                    Util.convertImage(originalImageUrl, (imageBlob) => this.loadConvertedImage(imageBlob));
                }
                else
                {
                    this.setState({ sequencePreviewUrl: originalImageUrl });
                    console.log("Original image was loaded");
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

    processFrameSequence()
    {
        if(!this.props.frame) 
        {
            alert("No frame loaded in the inspector!");
            return;
        }

        ImageProcessor.instance.processFrameSequence(this.props.frameSequence, this.props.frame.settings, this.props.encodingAlgorithm);
    }

    async downloadProcessedFrameSequence()
    {
        let zip = new JSZip();

        console.log('processed frame sequence', this.props.processedFrameSequence)

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
}
