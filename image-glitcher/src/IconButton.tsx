import React from 'react';
import { Colors } from './Colors';
import { CircularProgress, createMuiTheme, ThemeProvider } from '@material-ui/core';
import { Icon } from './Icon';

interface StyledButtonProps
{
    iconName : string,
    leftMargin : boolean,
    enabled : boolean,
    loading : boolean,
    borderColorIndex : number,
    hint : string,
    onClick : () => void
}

const theme = createMuiTheme(
{
    palette: {
        primary: {
            main: Colors.background,
        },
        secondary: {
            main: Colors.border,
        },
    },
});

export class IconButton extends React.Component<StyledButtonProps>
{
    static defaultProps = { leftMargin: false, enabled: true, loading: false, onClick: () => { }, borderColorIndex: 0, hint: "" };

    size = "48px";

    render()
    {
        let buttonStyle : React.CSSProperties = 
        {
            background: Colors.background,
            height: this.size,
            width: this.size,
            padding: "8px",
            border: "1px solid " + Colors.sunset[this.props.borderColorIndex],
            borderRadius: "4px",
            boxSizing: "border-box",
            cursor: "pointer",
            marginLeft: this.props.leftMargin ? "8px" : "0"
        };

        let progressStyle : React.CSSProperties = 
        {
            height: "100%",
            width: "100%"
        };

        let tooltip = this.props.hint ? 
        <span className="tooltip">
            {this.props.hint} 
        </span> : "";

        return (
            <button style={buttonStyle} disabled={!this.props.enabled} onClick={() => this.props.onClick()} className="iconButton">
                {this.props.loading ? 
                <ThemeProvider theme={theme}>
                    <CircularProgress style={progressStyle}/>
                </ThemeProvider> 
                : 
                <Icon iconName={this.props.iconName} button />}
                {tooltip}
            </button>
        );
    }
}
