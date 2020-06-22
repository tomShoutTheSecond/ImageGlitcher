import React from 'react';
import { State, Frame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';

interface FrameHolderProps
{
    frame : Frame,
    frameIndex : number
}

export class FrameHolder extends React.Component<FrameHolderProps>
{
    render()
    {
        let containerStyle : React.CSSProperties = 
        {
        };
        
        //img element has className downloadImg to make it easier to find later

        return (
            <div style={containerStyle}>
                <img className="downloadImg" src={this.props.frame.url} style={Styles.imageStyle}></img>
                <a href={this.props.frame.url} download={Util.getFrameName(this.props.frameIndex)}>{Util.getFrameName(this.props.frameIndex)}</a>
            </div>
        );
    }
}
