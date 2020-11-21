/**
 * Represents a link between an audio source and an ImageProcessor parameter
 */
export interface AudioLink
{
    audioBuffer : number[],
    parameterType : ParameterType,
    amount : number
}

export type ParameterType = "none" | "frequency" | "phase" | "amp" | "offset";