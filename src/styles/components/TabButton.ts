import { styled } from '../helpers/styled';

export const TabButton = styled.button<{ active: boolean }>`
    padding: 8px 16px;
    margin-right: 10px;
    border: none;
    background-color: ${(props) => (props.active ? '#4CAF50' : '#f0f0f0')};
    color: ${(props) => (props.active ? 'white' : 'black')};
    cursor: pointer;
    border-radius: 4px;

    &:hover {
        background-color: ${(props) => (props.active ? '#45a049' : '#e0e0e0')};
    }

    @media (max-width: 768px) {
        margin-right: 0;
        flex: 1;
        white-space: nowrap;
        padding: 10px;
    }
`;
