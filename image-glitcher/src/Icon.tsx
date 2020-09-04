import React from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import ArrowExpand from './icons/arrow-expand.svg';

interface IconProps
{
    iconName : string,
    button : boolean
}

export class Icon extends React.Component<IconProps>
{
    static defaultProps = { button: false };

    render()
    {
        let iconSize = "32px";
        let iconStyle : React.CSSProperties = 
        {
            width: this.props.button ? "100%" : iconSize,
            height: this.props.button ? "100%" : iconSize
        };

        return (
            <img src={Util.getIcon(this.props.iconName + '.svg')} style={iconStyle}/>
        );
    }
}
