import { Util } from './Util';

export class AudioProcessor
{
    audioContext = new AudioContext();

    async decodeFile(file : File)
    {
        return new Promise<AudioBuffer>((resolve, reject) => 
        {
            var reader1 = new FileReader();
            reader1.onload = ev =>
            {
                // Decode audio
                this.audioContext.decodeAudioData(ev!.target!.result as ArrayBuffer).then(buffer => 
                {
                    //var soundSource = this.audioContext.createBufferSource();
                    //soundSource.buffer = buffer;

                    resolve(buffer);
                });
            };
    
            reader1.readAsArrayBuffer(file);
        });
    }

    processBuffer(buffer : AudioBuffer, smoothingValue : number, framesPerSecond : number)
    {
        let leftSamples = buffer.getChannelData(0);

        //make lowpass buffer larger for more smoothing?
        //TODO: check this is correct DSP, lowpassBuffer length only seems to affect amplitude
        let lowpassBuffer = [];
        for (let i = 0; i < smoothingValue; i++) 
        {
            lowpassBuffer.push(0);
        }

        let lowpassedBuffer = [];

        for (let i = 0; i < leftSamples.length; i++) 
        {
            let sample = leftSamples[i];

            let sampleSquared = sample * sample;

            //add sample to lowpass buffer
            lowpassBuffer.unshift(sampleSquared);

            //remove oldest sample from lowpass buffer
            lowpassBuffer.pop();

            //apply lowpass processing to sample
            let sampleSquaredLowpassed = this.averageOfArray(lowpassBuffer);
            let sampleLowpassed = Math.sqrt(sampleSquaredLowpassed);

            lowpassedBuffer.push(sampleLowpassed);
        }

        //instead of above method, throw samples into a separate bucket for each frame, then take averages of the bucket contents 
        let sampleRateCoef = buffer.sampleRate / framesPerSecond;
        let totalFrames = buffer.length / sampleRateCoef;
        let samplesPerFrame = buffer.length / totalFrames;
        let buckets : number[][] = [];
        for (let sampleIndex = 0; sampleIndex < lowpassedBuffer.length; sampleIndex++) 
        {
            let sample = lowpassedBuffer[sampleIndex];
            let frameIndex = Math.floor(sampleIndex / samplesPerFrame);

            //add new bucket if needed
            if(buckets.length - 1 < frameIndex) 
                buckets[frameIndex] = [];

            buckets[frameIndex].push(sample);
        }

        let bucketAverages : number[] = [];
        buckets.forEach(bucket => 
        {
            bucketAverages.push(this.averageOfArray(bucket));
        });

        return bucketAverages;
    }

    getFrameIndexForSample(sampleIndex : number, samplesPerFrame : number)
    {
        return Math.floor(sampleIndex / samplesPerFrame);
    }

    //returns an interpolated value from a buffer when you need a value for an abstract (non integer) index
    findInterpolatedValue(inputBuffer : number[], floatingIndex : number)
    {
        let lowIndex = Math.floor(floatingIndex);
        let highIndex = Math.ceil(floatingIndex);

        let lowValue = inputBuffer[lowIndex];
        let highValue = inputBuffer[highIndex];

        let decimalPortion = floatingIndex % 1;

        //linear interpolation
        return Util.mixNumber(lowValue, highValue, decimalPortion);
    }

    averageOfArray(array : number[])
    {
        let sum = 0;
        for (let i = 0; i < array.length; i++ )
        {
            sum += array[i]; //don't forget to add the base
        }
        
        return sum / array.length;
    }
}