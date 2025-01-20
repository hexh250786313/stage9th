import { fadeIn } from '../helpers/animation';
import { styled } from '../helpers/styled';

export const TableRow = styled.tr<{ visible: boolean }>`
    opacity: 0;
    ${(props) =>
        props.visible &&
        styled.css`
            animation: ${fadeIn} 0.5s ease forwards;
        `}
`;
