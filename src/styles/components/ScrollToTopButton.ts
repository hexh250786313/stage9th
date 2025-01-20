import { styled } from '../helpers/styled';

export const ScrollToTopButton = styled.button<{
    visible: boolean;
}>`
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: grey;
    color: rgba(0, 0, 0, 0.8);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
        opacity 0.3s,
        background-color 0.3s;
    opacity: ${(props) => (props.visible ? 1 : 0)};
    pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};

    &:hover {
        background-color: white;
    }

    @media (max-width: 768px) {
        bottom: 20px;
        right: 20px;
        width: 36px;
        height: 36px;
    }
`;
