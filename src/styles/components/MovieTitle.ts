import { fadeInUp } from '../helpers/animation';
import { styled } from '../helpers/styled';

const calculateColor = (score: number) => {
    const normalizedScore = Math.max(0, Math.min(1, (score + 2) / 4));
    return `rgb(${Math.round(255 * normalizedScore)}, 0, ${Math.round(255 * (1 - normalizedScore))})`;
};

export const MovieTitle = styled.a<{ fontSize: number; score: number; index: number }>`
    font-size: ${(props) => props.fontSize}px;
    color: ${(props) => calculateColor(props.score)};
    text-align: center;
    cursor: pointer;
    transition: scale 0.2s;
    animation: ${fadeInUp} 0.5s ease forwards;
    animation-delay: ${(props) => props.index * 0.03}s;
    opacity: 0;
    text-decoration: none;

    &:hover {
        scale: 1.1;
        text-decoration: underline;
        color: ${(props) => calculateColor(props.score)};
    }

    &:link,
    &:visited,
    &:active {
        color: ${(props) => calculateColor(props.score)};
    }
`;
