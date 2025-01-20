import { styled } from '../helpers/styled';

export const FilterSection = styled.div`
    display: flex;
    gap: 20px;
    align-items: center;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }
`;
