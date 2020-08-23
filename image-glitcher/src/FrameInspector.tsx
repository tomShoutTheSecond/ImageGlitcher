import React, { RefObject, createRef, useRef } from 'react';
import { State, Frame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM, { findDOMNode } from 'react-dom';
import { Button } from '@material-ui/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import ArrowExpand from './icons/arrow-expand.svg';
import { ImageProcessorWindow, AmpModSettings } from './ImageProcessorWindow';
import { ImageProcessorAmpMod } from './ImageProcessorAmpMod';

interface FrameInspectorProps
{
    frame : Frame | null,
    imageData : Uint8Array,
    encodingAlgorithm : string
}

interface FrameInspectorState
{
    ampModSettings : AmpModSettings
}

export class FrameInspector extends React.Component<FrameInspectorProps, FrameInspectorState>
{
    state = { ampModSettings: new AmpModSettings(0, 0, 0, 0) };

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
        Object.keys(this.state.ampModSettings).map((settingName, key) => {
            let settingValue = Object.values(this.state.ampModSettings)[key];
            return(
                <div key={key}>
                    <label htmlFor={settingName}>{settingName}</label> <input onChange={(e) => this.updateSettings(settingName, parseFloat((e.target as HTMLInputElement).value))} style={numberInputStyle} id={settingName} type="number" value={settingValue}/>
                </div>
            );
        });

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Frame Inspector</h1>
                {previewImage}
                {ampModSettingsForm}
                <button style={Styles.bigButtonStyle} onClick={() => this.renderFrame()}>Re-render</button>
            </div>
        );
    }

    renderFrame()
    {
        ImageProcessorAmpMod.instance.processFrame(this.props.imageData, this.state.ampModSettings, this.props.encodingAlgorithm);
    }

    componentWillReceiveProps(nextProps : FrameInspectorProps)
    {
        if(!nextProps.frame) return;

        //update settings when a frame is loaded to the inspector
        if(nextProps.frame.ampModSettings != this.props.frame?.ampModSettings)
        {
            this.setState({ ampModSettings: nextProps.frame.ampModSettings });
        }
    }

    updateSettings(settingName : string, newValue : number)
    {
        let settings = Util.copy<AmpModSettings>(this.state.ampModSettings);
        switch(settingName)
        {
            case "frequency":
                settings.frequency = newValue;
                break;
            case "phase":
                settings.phase = newValue;
                break;
            case "amp":
                settings.amp = newValue;
                break;
            case "offset":
                settings.offset = newValue;
                break;
        }

        this.setState({ ampModSettings: settings });
    }
}
