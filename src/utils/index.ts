export interface ColumnsProps {
    id: number;
    des_campo: string;
    visible: boolean;
    default: number | string;
}

const ncm: ColumnsProps[] = [
    {
        id: 1,
        des_campo: 'COD_NCM',
        visible: false,
        default: 1,
    },
    {
        id: 2,
        des_campo: 'DES_NCM',
        visible: false,
        default: 'null',
    },
    {
        id: 3,
        des_campo: 'NUM_NCM',
        visible: false,
        default: 'null',
    },
    {
        id: 4,
        des_campo: 'TIPO_PIS_COFINS',
        visible: false,
        default: 0,
    },
    {
        id: 5,
        des_campo: 'TIPO_NAO_PIS_COFINS',
        visible: false,
        default: 1,
    },
    {
        id: 6,
        des_campo: 'COD_TAB_SPED',
        visible: false,
        default: 1,
    },
    {
        id: 7,
        des_campo: 'DES_TAB_SPED',
        visible: false,
        default: 'null',
    },
    {
        id: 8,
        des_campo: 'COD_CRED_PRES',
        visible: false,
        default: 1,
    },
    {
        id: 9,
        des_campo: 'PER_ALIQ_IMP',
        visible: false,
        default: 1,
    },
    {
        id: 10,
        des_campo: 'PER_ALIQ_NAC',
        visible: false,
        default: 1,
    },
    {
        id: 11,
        des_campo: 'PER_TAXA_DEPREC',
        visible: false,
        default: 1,
    },
    {
        id: 12,
        des_campo: 'FLG_EST_CRED_ICMS',
        visible: false,
        default: 1,
    },
    {
        id: 13,
        des_campo: 'PER_ALIQ_EST',
        visible: false,
        default: 1,
    },
    {
        id: 14,
        des_campo: 'PER_ALIQ_MUN',
        visible: false,
        default: 1,
    },
    {
        id: 15,
        des_campo: 'CHAVE_IBPT',
        visible: false,
        default: 1,
    },
    {
        id: 16,
        des_campo: 'FLG_INATIVO',
        visible: false,
        default: 1,
    },
    {
        id: 17,
        des_campo: 'COD_CEST',
        visible: false,
        default: 1,
    },
    {
        id: 18,
        des_campo: 'FLG_VEDA_CRED',
        visible: false,
        default: 1,
    },
    {
        id: 19,
        des_campo: 'COD_CRED_OUTORG',
        visible: false,
        default: 1,
    },
    {
        id: 20,
        des_campo: 'NUM_EXTIPI',
        visible: false,
        default: 1,
    },
    {
        id: 21,
        des_campo: 'FLG_VEDA_CRED_LIM',
        visible: false,
        default: 1,
    },
    {
        id: 22,
        des_campo: 'PER_VEDA_CRED_LIM',
        visible: false,
        default: 1,
    },
    {
        id: 23,
        des_campo: 'FLG_TRIB_ENT_TRANSF',
        visible: false,
        default: 1,
    },
    {
        id: 24,
        des_campo: 'COD_CONCAT',
        visible: false,
        default: 1,
    },
    {
        id: 25,
        des_campo: 'COD_TRIBUTACAO',
        visible: false,
        default: 1,
    },
    {
        id: 26,
        des_campo: 'COD_TRIB_ENTRADA',
        visible: false,
        default: 1,
    },
    {
        id: 27,
        des_campo: 'NUM_CEST',
        visible: false,
        default: 1,
    },
]

export { ncm }