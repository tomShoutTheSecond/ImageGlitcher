import React from 'react';
import { State, Frame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import ArrowExpand from './icons/arrow-expand.svg';
import { ImageProcessorWindow } from './ImageProcessorWindow';

interface FrameInspectorProps
{
    frame : Frame | null
}

export class FrameInspector extends React.Component<FrameInspectorProps>
{
    state = { hover: false };

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
        Object.keys(this.props.frame.ampModSettings).map((settingName, key) => {
            let settingValue = Object.values(this.props.frame!.ampModSettings)[key];
            return(
                <div key={key}>
                    <label htmlFor={settingName}>{settingName}</label><input style={numberInputStyle} id={settingName} type="number" defaultValue={settingValue}/>
                </div>
            );
        });


        //form code:
        //

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Frame Inspector</h1>
                {previewImage}
                {ampModSettingsForm}
                <button style={Styles.bigButtonStyle} onClick={() => {}}>Re-render</button>
            </div>
        );
    }
}
