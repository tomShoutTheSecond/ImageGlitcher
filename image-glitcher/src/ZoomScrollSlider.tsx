import React from 'react';
import { InterfaceUtilities } from './InterfaceUtilities';
import { MathUtils } from './MathUtils';
import { Colors } from './Colors';

const minZoom = 0.2;

interface ZoomScrollSliderProps
{
    width : number,
    height : number,
    marginHorizontal : number,
    marginVertical : number,
    onScrollChange : (value : number) => void,
    onZoomChange : (value : number) => void
}

interface ZoomScrollSliderBarPosition
{
    barWidth : number,
    barLeft : number,
    barRight : number
}

export class ZoomScrollSlider extends React.Component<ZoomScrollSliderProps>
{
    state = { scrollValue: 0.5, zoomValue: 1 };

    scrolling = false;
    zooming : string | null = null;

    dragStartX = 0;
    dragStartScroll = 0;

    dragStartBarLeft = 0;
    dragStartBarRight = 0;

    barLeft = 0;
    barRight = 0;

    componentDidMount()
    {
        //set up gesture input
        window.addEventListener('mouseup', this.globalMouseUp);
        window.addEventListener('mousemove', this.globalMouseMove);

        //and mobile gesture input
        window.addEventListener('touchend', this.globalTouchEnd);
        window.addEventListener('touchmove', this.globalTouchMove, { passive: false });

        this.redrawCanvas();
    }

    componentDidUpdate()
    {
        this.redrawCanvas();
    }

    render()
    {
        let sliderWidth = this.props.width;
        let sliderHeight = this.props.height;

        let marginHorizontal = this.props.marginHorizontal;
        let marginVertical = this.props.marginVertical;
    
        let containerWidth = sliderWidth + marginHorizontal * 2;
        let containerHeight = sliderHeight + marginVertical * 2;
    
        let containerStyle : React.CSSProperties = {
            backgroundColor: Colors.border,
            width: containerWidth,
            height: containerHeight,
            position: "relative",
            display: "table-cell",
            verticalAlign: "top"
        };
    
        let canvasStyle : React.CSSProperties = {
            backgroundColor: Colors.background,
            position: "relative",
            left: (containerWidth - sliderWidth) * 0.5,
            top: (containerHeight - sliderHeight) * 0.5,
            width: sliderWidth,
            height: sliderHeight
        };

        return(
            <div ref="container" style={containerStyle} onMouseDown={this.mouseDown} onTouchStart={this.touchStart}>
                <canvas ref="canvas" style={canvasStyle} onMouseMove={this.mouseMove} onMouseLeave={this.mouseLeave}/>
            </div>
        );
    }

    redrawCanvas()
    {
        this.redraw();
    }

    redraw()
    {
        let canvas = this.refs.canvas as HTMLCanvasElement;
        let context = canvas.getContext("2d")!;
        InterfaceUtilities.canvasFixDpi(canvas, context, false);

        context.clearRect(0, 0, canvas.width, canvas.height);

        //draw bar

        let { barWidth, barLeft, barRight } = this.calculateBarPosition();

        context.fillStyle = Colors.fill;
        context.beginPath();
        context.fillRect(barLeft, 0, barWidth, canvas.height);

        //draw handle circles

        let circleMargin = 10;
        let circleRadius = 3;

        context.fillStyle = Colors.white;
        context.arc(barLeft + circleMargin, circleMargin, circleRadius, 0, MathUtils.radians(360));
        context.closePath();
        context.arc(barRight - circleMargin, circleMargin, circleRadius, 0, MathUtils.radians(360));
        context.closePath();
        context.arc(barLeft + circleMargin, canvas.height - circleMargin, circleRadius, 0, MathUtils.radians(360));
        context.closePath();
        context.arc(barRight - circleMargin, canvas.height - circleMargin, circleRadius, 0, MathUtils.radians(360));
        context.closePath();
        context.fill();
    }

    /**
     * Calculates the current bar position from the current scrollValue and zoomValue
     */
    calculateBarPosition() : ZoomScrollSliderBarPosition
    {
        let canvas = this.refs.canvas as HTMLCanvasElement;
        let barWidth = canvas.width * this.state.zoomValue;
        let barCenterRange = canvas.width - barWidth;
        let barCenterMin = barWidth * 0.5;
        let barCenter = barCenterMin + barCenterRange * this.state.scrollValue;
        let barLeft = barCenter - barWidth * 0.5;
        let barRight = barLeft + barWidth;

        return {
            barWidth: barWidth,
            barLeft: barLeft,
            barRight: barRight
        };
    }

    /**
     * Calculates the current scrollValue and zoomValue from bar position
     */
    barPositionToZoomScroll(newBarLeft : number, newBarRight : number)
    {
        //calculate zoom value
        let canvas = this.refs.canvas as HTMLCanvasElement;
        let barWidth = newBarRight - newBarLeft;
        let newZoom = barWidth / canvas.width;

        //calculate scroll value
        let barCenterRange = canvas.width - barWidth;
        let barCenterMin = barWidth * 0.5;
        let barCenter = (newBarRight + newBarLeft) * 0.5;
        let newScroll = (barCenter - barCenterMin) / barCenterRange;

        if(isNaN(newScroll))
            newScroll = 0.5;

        return { newZoom, newScroll };
    }

    clientXToLocalX(clientX : number)
    {
        let canvas = this.refs.canvas as HTMLCanvasElement;
        let rect = canvas.getBoundingClientRect();
        return clientX - rect.left;
    }

    isOverHandle(localX : number) : string
    {
        let { barLeft, barRight } = this.calculateBarPosition();

        let leftHandleX = barLeft;
        let rightHandleX = barRight;

        let mouseHandleMargin = 8;

        let mouseOverLeftHandle = Math.abs(localX - leftHandleX) < mouseHandleMargin;
        let mouseOverRightHandle = Math.abs(localX - rightHandleX) < mouseHandleMargin;

        if(mouseOverLeftHandle)
            return "left";
        
        if(mouseOverRightHandle)
            return "right";
        
        return "none";
    }

    gesturePress(clientX : number)
    {
        let localX = this.clientXToLocalX(clientX);
        let handleGrabState = this.isOverHandle(localX);

        if(handleGrabState === "none")
        {
            this.scrolling = true;
            this.zooming = null;
        }
        else
        {
            this.zooming = handleGrabState;
            this.scrolling = false;
        }

        let { barLeft, barRight } = this.calculateBarPosition();

        this.dragStartX = localX;
        this.dragStartScroll = this.state.scrollValue;
        this.dragStartBarLeft = barLeft;
        this.dragStartBarRight = barRight;
    }

    gestureRelease()
    {
        this.scrolling = false;
        this.zooming = null;
    }

    gestureMove(clientX : number)
    {
        let localX = this.clientXToLocalX(clientX);
        this.updateValue(localX);
    }

    mouseDown = (e : React.MouseEvent) =>
    {
        this.gesturePress(e.clientX);
    }

    globalMouseUp = (e : MouseEvent) =>
    {
        this.gestureRelease();
    }

    globalMouseMove = (e : MouseEvent) =>
    {
        this.gestureMove(e.clientX);
    }

    mouseMove = (e : React.MouseEvent) =>
    {
        let localX = this.clientXToLocalX(e.clientX);
        let handleGrabState = this.isOverHandle(localX);

        if(handleGrabState === "left" || handleGrabState === "right")
            InterfaceUtilities.cursorStyle = 'ew-resize';
        else
            InterfaceUtilities.cursorStyle = 'default';
    }

    mouseLeave = (e : React.MouseEvent) =>
    {
        InterfaceUtilities.cursorStyle = 'default';
    }

    touchStart = (e : React.TouchEvent) =>
    {
        this.gesturePress(e.touches[0].clientX);
    }

    globalTouchEnd = (e : TouchEvent) =>
    {
        this.gestureRelease();
    }

    globalTouchMove = (e : TouchEvent) =>
    {
        if(!this.scrolling) return;

        e.preventDefault(); //stop page scrolling on mobile
        this.gestureMove(e.touches[0].clientX);
    }

    updateValue(localX : number)
    {
        let deltaX = localX - this.dragStartX;
        let canvas = this.refs.canvas as HTMLCanvasElement;

        let barWidth = canvas.width * this.state.zoomValue;
        let barCenterRange = canvas.width - barWidth;

        let valuePixelRatio = 1 / barCenterRange;

        if(this.scrolling)
        {
            //keep in range 0:1
            let newScrollValue = this.dragStartScroll + deltaX * valuePixelRatio;
            newScrollValue = Math.min(Math.max(0, newScrollValue), 1);

            //don't do anything if value hasn't changed
            if(newScrollValue === this.state.scrollValue) return;

            //update UI
            this.setState({scrollValue: newScrollValue});

            //update linked audio parameter
            this.props.onScrollChange(newScrollValue);

            return;
        }

        if(this.zooming === "left")
        {
            let newBarLeft = this.dragStartBarLeft + deltaX;

            //keep in range 0:this.dragStartBarRight
            newBarLeft = Math.min(Math.max(0, newBarLeft), this.dragStartBarRight);

            //calculate new zoom and scroll values from the new bar position
            let { newZoom, newScroll } = this.barPositionToZoomScroll(newBarLeft, this.dragStartBarRight);

            //keep in range minZoom:1
            newZoom = Math.min(Math.max(minZoom, newZoom), 1);

            //keep in range 0:1
            newScroll = Math.min(Math.max(0, newScroll), 1);

            //don't do anything if value hasn't changed
            if(newZoom === this.state.zoomValue && newScroll === this.state.scrollValue) return;

            //update UI
            this.setState({zoomValue: newZoom, scrollValue: newScroll});

            //update linked parameters
            this.props.onZoomChange(newZoom);
            this.props.onScrollChange(newScroll);

            return;
        }

        if(this.zooming === "right")
        {
            let newBarRight = this.dragStartBarRight + deltaX;

            //keep in range this.dragStartBarLeft:canvas.width
            newBarRight = Math.min(Math.max(this.dragStartBarLeft, newBarRight), canvas.width);

            //calculate new zoom and scroll values from the new bar position
            let { newZoom, newScroll } = this.barPositionToZoomScroll(this.dragStartBarLeft, newBarRight);

            //keep in range minZoom:1
            newZoom = Math.min(Math.max(minZoom, newZoom), 1);

            //keep in range 0:1
            newScroll = Math.min(Math.max(0, newScroll), 1);

            //don't do anything if value hasn't changed
            if(newZoom === this.state.zoomValue && newScroll === this.state.scrollValue) return;

            //update UI
            this.setState({zoomValue: newZoom, scrollValue: newScroll});

            //update linked parameters
            this.props.onZoomChange(newZoom);
            this.props.onScrollChange(newScroll);

            return;
        }
    }
}