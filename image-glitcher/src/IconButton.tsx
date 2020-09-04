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
    onClick : () => void
}

const theme = createMuiTheme(
{
    palette: {
        primary: {
            main: Colors.white,
        },
        secondary: {
            main: Colors.border,
        },
    },
});

export class IconButton extends React.Component<StyledButtonProps>
{
    static defaultProps = { leftMargin: false, enabled: true, loading: false, onClick: () => { } };

    size = "48px";

    render()
    {
        let buttonStyle : React.CSSProperties = 
        {
            background: Colors.fill,
            height: this.size,
            width: this.size,
            padding: "8px",
            border: "1px solid " + Colors.border,
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

        return (
            <button style={buttonStyle} disabled={!this.props.enabled} onClick={() => this.props.onClick()}>
                {this.props.loading ? 
                <ThemeProvider theme={theme}>
                    <CircularProgress style={progressStyle}/>
                </ThemeProvider> 
                : 
                <Icon iconName={this.props.iconName} button />}
            </button>
        );
    }
}
