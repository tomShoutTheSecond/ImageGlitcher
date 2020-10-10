import React, { createRef } from 'react';
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
    buffer : number[]
}

interface AudioProcessorWindowState
{
    smoothing : number,
    audioFile : File | null
}

export class AudioProcessorWindow extends React.Component<AudioProcessorWindowProps, AudioProcessorWindowState>
{
    fileInput = createRef<HTMLInputElement>();
    smoothingInput = createRef<HTMLInputElement>();

    audioProcessor = new AudioProcessor();

    state : AudioProcessorWindowState = { smoothing : 4, audioFile : null };

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
            width: "70%"
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Audio Processor</h1>
                <input type="file" ref={this.fileInput} onChange={async () => await this.loadAudioFromFile()} />
                <input type="number" ref={this.smoothingInput} onChange={() => this.changeSmoothing()} />
                <button onClick={async () => await this.analyse()}>Analyse</button>

                <Waveform fileName="no file" buffer={this.props.buffer} />
            </div>);
    }

    async analyse()
    {
        if(this.state.audioFile == null) return;

        let audioBuffer = await this.audioProcessor.decodeFile(this.state.audioFile);

        let bufferVolumeEnvelope = this.audioProcessor.processBuffer(audioBuffer, this.state.smoothing);
        State.setAudioEnvelope(bufferVolumeEnvelope);
    }

    changeSmoothing()
    {
        let smoothing = this.smoothingInput.current?.valueAsNumber;
        if (smoothing == undefined) return;

        this.setState({ smoothing: Math.round(smoothing) });
    }

    async loadAudioFromFile()
    {
        let fileInput = this.fileInput.current as HTMLInputElement;
        let audioFile = fileInput.files![0];

        if(!audioFile)
        {
            alert("Audio file not found");
            return;
        }

        this.setState({ audioFile: audioFile });
        this.analyse();

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