import React, { createRef, RefObject } from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import { FrameHolder } from './FrameHolder';
import { IconButton } from './IconButton';
import { AudioProcessor } from './AudioProcessor';
import { Waveform } from './Waveform';

interface AudioProcessorWindowProps
{
    buffers : number[][]
}

interface AudioProcessorWindowState
{
    audioFiles : File[]
}

export class AudioProcessorWindow extends React.Component<AudioProcessorWindowProps, AudioProcessorWindowState>
{
    audioProcessor = new AudioProcessor();

    fileInputs : HTMLInputElement[] | null[] = [];
    fpsInputs : HTMLInputElement[] | null[] = [];
    smoothingInputs : HTMLInputElement[] | null[] = [];

    defaultFramerate = 24;
    defaultSmoothing = 4;

    state : AudioProcessorWindowState = { audioFiles : [] };

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
            display: "inline-block",
            width: "70%",
            userSelect: "none"
        };

        let itemContainerStyle : React.CSSProperties = 
        {
            margin: "16px",
            padding: "16px",
            verticalAlign: "top",
            background: Colors.background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
            display: "inline-block",
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Audio Processor</h1>
                {this.props.buffers.map((buffer, key) => (
                    <div style={itemContainerStyle} key={key}>
                        <h1 style={Styles.h1Style}>Source {key}</h1>
                        <input type="file" ref={fileInput => this.fileInputs[key] = fileInput} onChange={async (e) => await this.loadAudioFromFile(key, e)} />
                        <br /><br />
                        <label>Smoothing: </label>
                        <input type="number" ref={smoothingInput => this.smoothingInputs[key] = smoothingInput} defaultValue={this.defaultSmoothing} />
                        <br /><br />
                        <label>Sync (FPS): </label>
                        <input type="number" ref={fpsInput => this.fpsInputs[key] = fpsInput} style={{ marginRight : "24px" }} defaultValue={this.defaultFramerate} />
                        <button onClick={async () => await this.analyse(key)}>Analyse</button>
                        <br /><br />
                        <Waveform fileName="no file" buffer={buffer} />
                    </div>
                ), this)}
                <IconButton iconName="plus" onClick={async () => await State.addAudioSource()}/>
            </div>);
    }

    async analyse(sourceIndex : number)
    {
        if (this.state.audioFiles.length - 1 < sourceIndex) return;

        let audioBuffer = await this.audioProcessor.decodeFile(this.state.audioFiles[sourceIndex]);

        let smoothing = this.smoothingInputs.length - 1 < sourceIndex ? this.defaultSmoothing : this.smoothingInputs[sourceIndex]?.valueAsNumber;
        if (!smoothing) return;

        let fps = this.fpsInputs.length - 1 < sourceIndex ? this.defaultFramerate : this.fpsInputs[sourceIndex]?.valueAsNumber;
        if (!fps) return;

        let bufferVolumeEnvelope = this.audioProcessor.processBuffer(audioBuffer, smoothing, fps);

        let fileInput = this.fileInputs[sourceIndex];
        if (fileInput?.value == null) return;

        let fullPath = fileInput.value;
        let startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
        let filename = fullPath.substring(startIndex);
        if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) 
        {
            filename = filename.substring(1);
        }

        console.log("bufferVolumeEnvelope", bufferVolumeEnvelope)
        State.setAudioEnvelope(sourceIndex, bufferVolumeEnvelope, filename);
    }
/*
    changeSmoothing(key : number, event : any)
    {
        let smoothing = (event.target as HTMLInputElement)?.valueAsNumber;
        if (smoothing == undefined) return;

        let smoothings = this.state.smoothings;
        smoothings[key] = Math.round(smoothing);
        this.setState({ smoothings : smoothings });

        console.log("smoothing changed to ", smoothing)
    }

    changeFramesPerSecond(index : number)
    {
        let fpsInput = this.fpsInputs[index];
        if(fpsInput == null) return;
        
        let fps = fpsInput.valueAsNumber;
        if (fps == undefined) return;

        this.setState({ framesPerSecond: Math.round(fps) });
    }
*/
    async loadAudioFromFile(key : number, event : any)
    {
        //let fileInput = this.fileInput.current as HTMLInputElement;
        let audioFile = this.fileInputs[key]?.files![0];
        //let audioFile = (event.target as HTMLInputElement).files![0];

        if(!audioFile)
        {
            alert("Audio file not found");
            return;
        }

        let audioFiles = this.state.audioFiles;
        audioFiles[key] = audioFile;
        console.log(audioFiles)
        this.setState({ audioFiles: audioFiles });

        //let audioIsWav = audioFile.name.endsWith(".wav");
        
        //let fileReader = new FileReader();

        /*
        fileReader.readAsArrayBuffer(audioFile);
        fileReader.onloadend = () =>
        {
            //get data from file (if bitmap was supplied)
            if(audioIsWav)
            {
                this.audioProcessor.decodeFile()

                //let result = fileReader.result as ArrayBuffer;
                //let rawData = new Uint8Array(result);
                //console.log("audio data:", rawData);
                //State.setImageData(rawData);
            }
            /*
            //put preview in component
            fileReader.readAsDataURL(audioFile);

            fileReader.onloadend = () =>
            {
                let originalImageUrl = fileReader.result as string;

                if(!audioIsWav)
                {
                    this.setState({ isConverting: true });
                    this.convertImage(originalImageUrl);
                }
                else
                {
                    this.setState({ previewUrl: originalImageUrl });
                    console.log("Original image was loaded");
                }
            }
            
        }*/
    }
}