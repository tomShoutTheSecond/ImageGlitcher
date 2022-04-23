import React from 'react';
import { State } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { IconButton } from './IconButton';
import { AudioProcessor } from './AudioProcessor';
import { Waveform } from './Waveform';
import { Card } from '@material-ui/core';

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
        let itemContainerStyle : React.CSSProperties = 
        {
            margin: "16px",
            padding: "16px",
            verticalAlign: "top",
            background: Colors.fill,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
            display: "inline-block",
        };

        return (
            <Card style={Styles.containerStyle}>
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
                        <label>Total frames: {buffer.length}</label>
                        <br /><br />
                        <Waveform fileName="no file" buffer={buffer} />
                    </div>
                ), this)}
                <div style={Styles.alignRight}>
                    <IconButton iconName="plus" hint="Add audio file" onClick={async () => await State.addAudioSource()}/>
                </div>
            </Card>);
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

    async loadAudioFromFile(key : number, event : any)
    {
        let audioFile = this.fileInputs[key]?.files![0];

        if(!audioFile)
        {
            alert("Audio file not found");
            return;
        }

        let audioFiles = this.state.audioFiles;
        audioFiles[key] = audioFile;
        console.log(audioFiles)
        this.setState({ audioFiles: audioFiles });
    }
}