import { styled } from '../helpers/styled';

export const FilterItem = styled.div`
    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        gap: 5px;

        label {
            font-weight: bold;
        }
    }
`;
