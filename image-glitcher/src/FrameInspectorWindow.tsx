import React, { RefObject, createRef, useRef } from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM, { findDOMNode } from 'react-dom';
import { Button, Card } from '@material-ui/core';
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
    imageData : Uint8Array[],
    encodingAlgorithm : string,
}

interface FrameInspectorState
{
    settings : ImageProcessorSettings,
}

export class FrameInspectorWindow extends React.Component<FrameInspectorProps, FrameInspectorState>
{
    state = { settings: new ImageProcessorSettings("ampMod", AmpModSettings.default, DelaySettings.default, ShuffleSettings.default) };
    
    fileInput = createRef<HTMLInputElement>();

    render()
    {
        let numberInputStyle : React.CSSProperties = 
        {
            width: "100px"
        };

        let previewImage = this.props.frame == null ? <p style={Styles.leftMargin}>No image</p> : <img src={this.props.frame.url} style={Styles.imageStyle}/>;
        let settingsForm = this.props.frame == null ? "" : 
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

        return (
            <Card style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>Frame Inspector</h1>
                {previewImage}
                {settingsForm}
                <div style={Styles.alignRight}>
                    <IconButton iconName="image-move" hint="Render frame" onClick={() => this.renderFrame()}/>
                </div>
            </Card>
        );
    }

    renderFrame()
    {
        ImageProcessor.instance.processKeyFrame(this.props.imageData[0], this.state.settings, this.props.encodingAlgorithm);
    }

    componentWillReceiveProps(nextProps : FrameInspectorProps)
    {
        if(!nextProps.frame) return;

        //update settings when a frame is loaded to the inspector
        if(nextProps.frame.settings != this.props.frame?.settings)
        {
            this.setState({ settings: nextProps.frame.settings });
        }
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
}
