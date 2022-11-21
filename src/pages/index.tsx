import type { NextPage } from 'next'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Accordion, Badge, Button, Card, Spinner } from 'react-bootstrap';
import { Container, Header } from '../styles/pages/home'
import { MdDeleteForever } from 'react-icons/md'
import { IoOptionsOutline } from 'react-icons/io5'
// import { ColumnsProps } from '../utils/index'
// import dynamic from 'next/dynamic'

import { ColumnsProps, ncm, produto } from '../utils/index'

import FileSaver from 'file-saver';

interface WhereProps {
  whereCampo: {
    id: number;
    descricao: string;
    type: string;
  };
  whereColumn: {
    id: number;
    descricao: string;
  };
}

// const tableStructure = dynamic<ColumnsProps>(() => {
//   return import('../utils/index').then(mod => mod.ncm)
// })

// let pluBaixo: string = '00000001';
// let pluAlto: string = '01000000';

const Home: NextPage = () => {
  const [table, setTable] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<ColumnsProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCabecalho, setShowCabecalho] = useState<boolean>(true);
  const [toggleSelectAll, setToggleSelectAll] = useState<boolean>(false);
  const [toggleInsertOrUpdate, setToggleInsertOrUpdate] = useState<boolean>(false);
  const [toggleRemoverCaracterEspecial, setToggleRemoverCaracterEspecial] = useState<boolean>(false);
  const [toggleLimitarTamanhoDoCampos, setToggleLimitarTamanhoDoCampos] = useState<boolean>(false);
  const [toggleGerarPlu, setToggleGerarPlu] = useState<boolean>(false);
  const [collapse, setCollapse] = useState<string>('1');
  const [selectedCampoWhere, SetSelectedCampoWhere] = useState<string>('');
  const [selectedColunaWhere, setSelectedColunaWhere] = useState<string>('');
  const [tipoDoCampoPorId, setTipoDoCampoPorId] = useState<any>();
  const [where, setWhere] = useState<WhereProps[]>([])
  const [filter, setFilter] = useState<string>('');
  const [indexCodBarras, setIndexCodBarra] = useState<string>('');

  const getArrayIndexed = function (
    arr: any[],
    fieldNameKey: string,
    fieldNameValue: string,
  ) {
    const r: any = {};
    for (let i = 0; i < arr.length; i++)
      r[`${arr[i][fieldNameKey]}`] = arr[i][fieldNameValue];
    return r;
  };

  function handleSetSelectedTable(table: string) {
    setLoading(true);
    switch (table) {
      case 'NCM':
        setSelectedTable(ncm)
        setCollapse('0')
        setTipoDoCampoPorId(getArrayIndexed(ncm, 'id', 'type'))
        break;
      case 'PRODUTO':
        setSelectedTable(produto)
        setCollapse('0')
        setTipoDoCampoPorId(getArrayIndexed(produto, 'id', 'type'))
        break;

      case 'SELECIONE':
        setSelectedTable([])
        setCollapse('1')
        break;

      default:
        break;
    }
    setLoading(false);
  }

  function handleChangeCheckedColumns(checkBox: ColumnsProps) {
    const clickedItem = selectedTable?.find((item) => item.des_campo === checkBox.des_campo);
    const otherItems = selectedTable?.filter((item) => item.des_campo !== checkBox.des_campo);
    if (clickedItem) {
      clickedItem.visible = !checkBox.visible;
      if (otherItems) {
        const joinEditedAndOldItems = [...otherItems, clickedItem]
        joinEditedAndOldItems.sort((a, b) => a.id - b.id);
        setSelectedTable(joinEditedAndOldItems)
        return;
      }
      setSelectedTable([clickedItem])
    }
  }

  function handleToggleSelectAll() {
    if (toggleSelectAll) {
      const allDeselectedItems = selectedTable?.map((item) => {
        item.visible = false;
        return item;
      })
      setToggleSelectAll(false);
      setSelectedTable(allDeselectedItems);
      return;
    }
    const allDeselectedItems = selectedTable?.map((item) => {
      item.visible = true;
      return item;
    })
    setToggleSelectAll(true);
    setSelectedTable(allDeselectedItems);
  }


  const [dadosDoArquivo, setDadosDoArquivo] = useState<any>();
  const [csvQtdColumns, setCsvQtdColumns] = useState<number>();
  const fileRef = useRef(null);

  const readFile = (event: any) => {
    const fileReader = new FileReader();
    const { files } = event.target;

    fileReader.readAsText(files[0], "iso-8859-1");
    fileReader.onload = (e: any) => {
      const result = e.target.result;
      const resultInArra = result.split('\n')
      const formatedArray = resultInArra.map((item: any) => {
        item = item.replace('\r', '')
        item = item.replace('\n', '')
        return item.split(';')
      });
      setCsvQtdColumns(formatedArray[0].length);
      setDadosDoArquivo(formatedArray);
    };
  };

  const generatePlu = useCallback((plu: string) => {
    const caracteres: string[] = plu.split('');
    let soma: number = 0;
    let divisao: number = 0;
    let novasoma: number = 0;
    let multiplicacao: number = 0;
    let novovalor: number = 0;

    for (let i = 0; i < caracteres.length; i++) {
      if (i % 2 === 0) {
        soma = soma + Number(caracteres[i]) * 1;
      } else {
        soma = soma + Number(caracteres[i]) * 3;
      }
    }

    divisao = soma / 10;
    divisao = Math.floor(divisao);

    novasoma = Number(divisao + 1);

    multiplicacao = novasoma * 10;

    novovalor = multiplicacao - soma;

    if (novovalor % 10 === 0) {
      novovalor = 0;
    }

    const newValue = plu.substring(1, 8) + novovalor;
    return newValue;
  }, []);

  const handleGerarSql = useCallback((e: any) => {
    const formData = new FormData(e.target);
    formData.delete('cod_barra_plu');
    const data = Object.fromEntries(formData.entries());
    /**
     * indiceCampoColuna informa qual campo receberá o valor de cada coluna do arquivo
     * além de qual tipo de dado e dado padrão cada campo receberá.
     */
    // console.log(tipoDoCampoPorId)
    // console.log(where)
    let indiceCampoColuna: any = Object.values(data);
    indiceCampoColuna = indiceCampoColuna.map((value: any) => {
      return JSON.parse(value)
    })
    console.log({ indiceCampoColuna })
    /**
     * Contadores para geração de PLU
     * pluBaixo
     * pluPadrão
     */
    let pluBaixo = 1;
    let pluAlto = 1000000;
    // console.log(indiceCampoColuna)
    const script = [];
    // console.log({ data })
    // console.log({ dadosDoArquivo })
    // console.log({ indiceCampoColuna })
    // console.log({ where })
    // return

    // UPDATE
    if (toggleInsertOrUpdate) {
      // roda todas as linhas
      for (let i = 0; i < dadosDoArquivo.length; i++) {
        const values = [];

        // Formata os valores
        for (let l = 0; l < indiceCampoColuna.length; l++) {
          if (dadosDoArquivo[i][indiceCampoColuna[l].index]) {
            if (indiceCampoColuna[l].type === 'string') {
              values.push(`'${dadosDoArquivo[i][indiceCampoColuna[l].index]}'`)
            } else {
              values.push(dadosDoArquivo[i][indiceCampoColuna[l].index])
            }
          }
          if (dadosDoArquivo[i][indiceCampoColuna[l].index] === '') {
            if (indiceCampoColuna[l].type === 'string') {
              values.push(`'${indiceCampoColuna[l].default}'`)
            } else {
              values.push(String(indiceCampoColuna[l].default))
            }
          }
        }
        // Formata o where
        const whereClause = [];
        for (let k = 0; k < where.length; k++) {
          if (dadosDoArquivo[i][where[k].whereColumn.id]) {
            if (tipoDoCampoPorId[where[k].whereCampo.id] === 'string') {
              whereClause.push(` ${where[k].whereCampo.descricao} = '${dadosDoArquivo[i][where[k].whereColumn.id]}'`)
            } else {
              whereClause.push(` ${where[k].whereCampo.descricao} = ${dadosDoArquivo[i][where[k].whereColumn.id]}`)
            }
          }
          if (dadosDoArquivo[i][where[k].whereColumn.id] === '') {
            const defaultValue = indiceCampoColuna.find((indice: any) => indice.index === where[k].whereColumn.id);
            if (defaultValue) {
              whereClause.push(` ${where[k].whereCampo.descricao} = ${defaultValue.default}`)
            }
          }
        }
        // console.log(whereClause)
        const updateValues = [];
        for (let j = 0; j < values.length; j++) {
          updateValues.push(` ${Object.keys(data)[j]} = ${values[j]}`)
        }
        script.push(`UPDATE ncm\r\n SET${updateValues.join(',\r\n')}\r\nWHERE ${whereClause.join(' and')};\r\n`)
        // script.push(`UPDATE ncm\r\nSET ${updateValues.join(', \r\nAND\r\n')}\r\nWHERE ${whereClause.join(' and')};\r\n`) Update with AND
      }
      // const blob = new Blob(script, { type: "text/plain;charset=utf-8" });
      // FileSaver.saveAs(blob, "teste.sql");
      // console.log(script)
      // setLoading(false)
      // setTimeout(() => {
      //   console.log('teste');
      //   setLoading(false)
      // }, 1500)
      return;
    }

    /**
     * INSERT
     * Loop para passar por todas as linhas do arquivo selecionado
     */
    for (let i = 0; i < dadosDoArquivo.length; i++) {
      const values = []; // armazena os valores formatados para adicionar ao insert
      /**
       * Loop para passar por todos os campos selecionados pelo usuário
       */
      for (let l = 0; l < indiceCampoColuna.length; l++) {

        /**
         * Caso exista valor no campo
         */
        if (dadosDoArquivo[i][indiceCampoColuna[l].index]) {
          let value = dadosDoArquivo[i][indiceCampoColuna[l].index];
          // gerar codigo de barras igual plu
          if (indiceCampoColuna[l].tratarCodBarras === 'true') {
            value = String(value).padStart(13, "0")
          }
          if (indiceCampoColuna[l].index === Number(indexCodBarras) && indexCodBarras !== '') {
            if (Number(dadosDoArquivo[i][indiceCampoColuna[l].index]) < 70000000 || dadosDoArquivo[i][indiceCampoColuna[l].index].length < 8) {
              value = generatePlu(String(pluBaixo).padStart(8, "0"))
              value = value.padStart(13, "0")
            }
          }
          /**
           * Se for do tipo String
           */
          if (indiceCampoColuna[l].type === 'string') {
            if (indiceCampoColuna[l].genPlu === 'false') {
              /**
              * Remove caracteres especiais se necessário
              */
              if (indiceCampoColuna[l].removeCaracters === 'true') {
                value = value.normalize('NFD').replace(/[^a-zA-Z0-9 ]/g, "");
              }
              /**
               * Limita o tamanho do campo se necessário
               */
              if (indiceCampoColuna[l].sizeOfField === 'true') {
                value = value.substring(0, Number(indiceCampoColuna[l].size))
              }
            } else {
              if (Number(dadosDoArquivo[i][indiceCampoColuna[l].indexCodBarras]) < 70000000 || dadosDoArquivo[i][indiceCampoColuna[l].indexCodBarras].length < 8) {
                value = generatePlu(String(pluBaixo).padStart(8, "0"))
                pluBaixo++
              } else {
                value = generatePlu(String(pluAlto).padStart(8, "0"))
                pluAlto++
              }
            }
            values.push(`'${value}'`)
            /**
             * Caso não seja String
             */
          } else {
            if (indiceCampoColuna[l].genPlu === 'false') {
              /**
               * Limita o tamanho do campo se necessário
               */
              if (indiceCampoColuna[l].sizeOfField === 'true') {
                value = value.substring(0, Number(indiceCampoColuna[l].size))
              }
            } else {
              if (Number(dadosDoArquivo[i][indiceCampoColuna[l].indexCodBarras]) < 70000000 || dadosDoArquivo[i][indiceCampoColuna[l].indexCodBarras].length < 8) {
                value = generatePlu(String(pluBaixo).padStart(8, "0"))
                pluBaixo++
              } else {
                value = generatePlu(String(pluAlto).padStart(8, "0"))
                pluAlto++
              }
            }
            values.push(value)
          }
        }
        /**
         * Caso não exista valor no campo é utilizado o valor default da coluna
         */
        if (dadosDoArquivo[i][indiceCampoColuna[l].index] === '') {
          let value = indiceCampoColuna[l].default;
          if (indiceCampoColuna[l].tratarCodBarras === 'true') {
            value = String(value).padStart(13, "0")
          }
          if (indiceCampoColuna[l].index === Number(indexCodBarras) && indexCodBarras !== '') {
            if (Number(dadosDoArquivo[i][indiceCampoColuna[l].index]) < 70000000 || dadosDoArquivo[i][indiceCampoColuna[l].index].length < 8) {
              value = generatePlu(String(pluBaixo).padStart(8, "0"))
              value = value.padStart(13, "0")
            }
          }
          if (indiceCampoColuna[l].type === 'string') {
            if (indiceCampoColuna[l].genPlu === 'false') {
              values.push(`'${value}'`)
            } else {
              if (Number(dadosDoArquivo[i][indiceCampoColuna[l].indexCodBarras]) < 70000000) {
                value = generatePlu(String(pluBaixo).padStart(8, "0"))
                values.push(`'${value}'`)
                pluBaixo++
              } else {
                value = generatePlu(String(pluAlto).padStart(8, "0"))
                values.push(`'${value}'`)
                pluAlto++
              }
            }
          } else {
            if (indiceCampoColuna[l].genPlu === 'false') {
              values.push(String(value))
            } else {
              if (Number(dadosDoArquivo[i][indiceCampoColuna[l].indexCodBarras]) < 70000000) {
                value = generatePlu(String(pluBaixo).padStart(8, "0"))
                values.push(`'${value}'`)
                pluBaixo++
              } else {
                value = generatePlu(String(pluAlto).padStart(8, "0"))
                values.push(`'${value}'`)
                pluAlto++
              }
            }
          }
        }
      }
      script.push(`insert into ncm (${Object.keys(data).join()}) values (${values});\r\n`)
    }
    const blob = new Blob(script);
    FileSaver.saveAs(blob, "teste.sql");
    console.log('gerado')
    // setLoading(false)

  }, [dadosDoArquivo, generatePlu, indexCodBarras, tipoDoCampoPorId, toggleInsertOrUpdate, where]);


  useEffect(() => {
    if (dadosDoArquivo)
      console.log({ dadosDoArquivo: dadosDoArquivo })
  }, [dadosDoArquivo])


  const handleNewWhereClause = useCallback((e: any) => {
    const formData = new FormData(e.target);
    const data: any = Object.fromEntries(formData.entries());
    console.log(data)

    const campo = JSON.parse(data.whereCampo);
    const coluna = JSON.parse(data.whereColumn);

    setWhere([...where, {
      whereCampo: {
        id: campo.index,
        descricao: campo.des_campo,
        type: campo.type,
      },
      whereColumn: {
        id: coluna.index,
        descricao: coluna.des_column,
      },
    }])
  }, [where])

  return (
    <>
      <Header className="container-fluid">
        <h1>Importador</h1>
      </Header>
      <Container className="container">
        {loading === true && (
          <div
            className="loadingOpacity"
            aria-label="closeMenu"
          >
            <Spinner animation="border" variant="info" />
          </div>
        )}
        {/* 
          Selecionar arquivo e tabela
        */}
        <div className="row">
          <div className="mt-4 mb-3">
            <label htmlFor="formFile" className="form-label file-button">Importar arquivo CSV</label>
            <input className="form-control" type="file" id="formFile" ref={fileRef} onChange={readFile} />
          </div>
          <div className="col-md-4 col-sm-12">
            <select className="form-select" aria-label="Default select example" onChange={(e) => {
              setTable(e.target.value);
              handleSetSelectedTable(e.target.value);
            }} defaultValue="selecione">
              <option value="SELECIONE">Selecione um modelo de tabela</option>
              <option value="NCM">NCM</option>
              <option value="NCMUF">NCMUF</option>
              <option value="PRODUTO">PRODUTO</option>
            </select>
          </div>
        </div>

        {/* 
          Opções e configurações
        */}
        <div className="row">
          <div className="col-3 mt-3">
            <div className="form-check form-switch" title='Se marcado remove a primeira linha do arquivo CSV'>
              <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault" />
              <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Remover Cabeçalho?</label>
            </div>
          </div>
          <div className="col-3 mt-3">
            <div className="form-check form-switch" title='Se marcado gera um script de update'>
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchScriptToUpdate"
                disabled={collapse === '1'}
                onChange={() => setToggleInsertOrUpdate(!toggleInsertOrUpdate)}
                checked={toggleInsertOrUpdate}
              />
              <label className="form-check-label" htmlFor="flexSwitchScriptToUpdate">Gerar script de update</label>
            </div>
          </div>
          <div className="col-3 mt-3">
            <div className="form-check form-switch" title='Se marcado remove caracter especial de todos os campos do tipo texto'>
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchRemoveCaracter"
                disabled={collapse === '1'}
                onChange={() => setToggleRemoverCaracterEspecial(!toggleRemoverCaracterEspecial)}
                checked={toggleRemoverCaracterEspecial}
              />
              <label className="form-check-label" htmlFor="flexSwitchRemoveCaracter">Remover caracter especial</label>
            </div>
          </div>
          <div className="col-3 mt-3">
            <div className="form-check form-switch" title='Se marcado limita o tamanho do campo ao tamanho definido na tabela'>
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchLimitarTodos"
                disabled={collapse === '1'}
                onChange={() => setToggleLimitarTamanhoDoCampos(!toggleLimitarTamanhoDoCampos)}
                checked={toggleLimitarTamanhoDoCampos}
              />
              <label className="form-check-label" htmlFor="flexSwitchLimitarTodos">Limitar tamanho dos campos</label>
            </div>
          </div>
        </div>
        <div className="row mt-4">
          <div className="col-6 mt-2" style={{
            display: 'flex',
            flexDirection: 'row'
          }}>
            <div className="form-check form-switch" title='Se marcado gera um script de update' style={{
              width: '200px',
              marginTop: '8px'
            }}>
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchGeneratePlu"
                disabled={collapse === '1'}
                onChange={() => setToggleGerarPlu(!toggleGerarPlu)}
                checked={toggleGerarPlu}
                data-bs-toggle="collapse"
                data-bs-target="#collapseIndexBar"
                aria-expanded="false"
                aria-controls="collapseIndexBar"
              />
              <label className="form-check-label" htmlFor="flexSwitchGeneratePlu">Gerar PLU</label>
            </div>
            {toggleGerarPlu && (
              <select
                name="cod_barra_principal"
                className="form-control"
                aria-label="Default select example"
                defaultValue="selecione"
                onChange={(e) => setIndexCodBarra(e.target.value)}
                id="selectCodBarras"
                disabled={!toggleGerarPlu}
              >
                {dadosDoArquivo && dadosDoArquivo[0].map((_item: any, index: any) => {
                  return (
                    <option
                      key={index}
                      value={`${index}`}
                    >
                      {`Index [${index}]`}
                    </option>)
                })}
              </select>
            )}
          </div>
        </div>

        {/* 
          Seleção de campos que entrarão no script
        */}
        {selectedTable && (
          <div className="row mt-5">
            <div className="col-12 checkbox-list">
              <Accordion defaultActiveKey="0">
                <div className="row expand-button" onClick={() => collapse === '1' ? setCollapse('0') : setCollapse('1')}>
                  <div className="col-12">
                    <h5>Expandir Visualização de colunas</h5>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filtrar"
                      aria-label="Filtrar"
                      aria-describedby="basic-filter"
                      onChange={(e) => {
                        setFilter(e.target.value.toUpperCase());
                      }}
                    />
                  </div>
                  <div className="col-12 mt-4">
                    <div className="form-check form-switch" title='Se marcado remove a primeira linha do arquivo CSV'>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="flexSwitchToggleAll"
                        disabled={collapse === '1'}
                        onChange={() => handleToggleSelectAll()}
                        checked={toggleSelectAll}
                      />
                      <label className="form-check-label" htmlFor="flexSwitchToggleAll">Selecionar Todos</label>
                    </div>
                  </div>
                </div>
                <Accordion.Collapse
                  eventKey={collapse}
                >
                  <>
                    {selectedTable && selectedTable.filter((table) =>
                      table.des_campo
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .includes(filter.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
                    ).map((table) => {
                      return (
                        <div className="form-check" key={table.des_campo}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`${table.des_campo}-flexCheckDefault`}
                            checked={table.visible}
                            // onClick={() => handleChangeCheckedColumns(table)}
                            onChange={() => handleChangeCheckedColumns(table)}
                          />
                          <label className="form-check-label" htmlFor={`${table.des_campo}-flexCheckDefault`}>
                            {table.des_campo}
                          </label>
                        </div>
                      )
                    })}
                  </>
                </Accordion.Collapse>
              </Accordion>
            </div>
          </div>
        )}

        {/* 
          Montagem do script
        */}
        <div className="row mt-3 mb-5">
          <div className="col-12 inputs-list">
            <div className="col-12" style={{ padding: '0px 5px' }}>
              <h5>Vincular campos com colunas do arquivo CSV</h5>
              <p>Seu documento CSV possuí {csvQtdColumns} colunas iniciando na posição 0. Selecione a coluna equivalente ao campo de sua tabela.</p>
              <div className="col-12 mb-4">
                <div className="form-check form-switch" title='Se marcado remove a primeira linha do arquivo CSV'>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="flexSwitchToggleExibirCabecalho"
                    onChange={() => setShowCabecalho(!showCabecalho)}
                    checked={showCabecalho}
                  />
                  <label className="form-check-label vincula-label" htmlFor="flexSwitchToggleExibirCabecalho">Exibir Primeira Linha Como Cabeçalho</label>
                </div>
              </div>
              <div className="col-12 mb-2" style={{ padding: '0px 15px' }}>
                {/* <Badge bg="secondary">{dadosDoArquivo[0][0]}</Badge> */}
                {showCabecalho && dadosDoArquivo && (dadosDoArquivo[0].map((item: any, index: any) => {
                  return <Badge bg="secondary" className="badg" key={index}>{`${item} - index [${index}]`}</Badge>
                }))}
              </div>
            </div>
            <form id="primaryForm" onSubmit={(e) => {
              e.preventDefault();
              handleGerarSql(e);
            }}>
              {/* 
                Vinculo de campos da tabela com colunas do arquivo CSV
              */}
              <div className="row list-container">
                {toggleInsertOrUpdate && (
                  <div className="col-12 mt-4" style={{ padding: '0px 5px' }}>
                    <h5>Update</h5>
                  </div>
                )}
                {selectedTable
                  && selectedTable.filter((item) => item.visible === true)
                    .map((item) => {
                      let removeCaracter = item.removeCaracters;
                      let sizeOfField = item.sizeOfField;
                      let genPlu = item.genPlu;
                      let size = item.size;
                      let indexCodBarras = item.indexCodBarras;
                      let tratarCodBarras = item.tratarCodBarras;
                      if (toggleRemoverCaracterEspecial && item.removeCaractersBlock === false) {
                        removeCaracter = true;
                      }
                      if (toggleLimitarTamanhoDoCampos) {
                        sizeOfField = true;
                      }
                      return (
                        <div className="col-md-4 col-sm-12" key={item.id}>
                          <Card>
                            <Card.Body>
                              <Card.Subtitle className="mb-2 text-muted">
                                {item.des_campo}
                              </Card.Subtitle>
                              <div className="field-options">
                                <select
                                  name={item.des_campo}
                                  className="form-select"
                                  aria-label="Default select example"
                                  defaultValue="selecione"
                                >
                                  {dadosDoArquivo && dadosDoArquivo[0].map((_item: any, index: any) => {
                                    return (
                                      <option
                                        key={index}
                                        value={`{
                                          "index": ${index}, 
                                          "default": ${item.default}, 
                                          "type": "${item.type}",
                                          "removeCaracters": "${removeCaracter}",
                                          "autoPlu": "${item.autoPlu}",
                                          "sizeOfField": "${sizeOfField}",
                                          "size": "${size}",
                                          "genPlu": "${genPlu}",
                                          "indexCodBarras": "${indexCodBarras}",
                                          "tratarCodBarras": "${tratarCodBarras}"
                                          }`}>
                                        {`Index [${index}]`}
                                      </option>)
                                  })}
                                </select>
                                <button
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target={`#collapse${item.id}`}
                                  aria-expanded="false"
                                  aria-controls={`collapse${item.id}`}
                                >
                                  <IoOptionsOutline />
                                </button>
                              </div>
                              {/* Opções de formatação do campo */}
                              <div className="collapse collapse-layout" id={`collapse${item.id}`}>
                                <div className="card card-body">
                                  <div className="row">
                                    {/* Remover caracter especial */}
                                    <div className="col-12">
                                      <div className="form-check form-switch" title='Se marcado gera um script de update'>
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`flexSwitchRemoveSpecial${item.id}`}
                                          disabled={collapse === '1'}
                                          onChange={() => {
                                            setSelectedTable((oldValues) => oldValues.filter((field) => {
                                              if (field.id === item.id) {
                                                field.removeCaracters = !removeCaracter
                                              }
                                              return field;
                                            }))
                                          }}
                                          checked={removeCaracter}
                                        />
                                        <label className="form-check-label" htmlFor={`flexSwitchRemoveSpecial${item.id}`}>Remover caracter especial</label>
                                      </div>
                                    </div>
                                    {/* Limitar tamanho do campo */}
                                    <div className="col-12">
                                      <div className="form-check form-switch" title='Se marcado gera um script de update'>
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`flexSwitchLimitarTamanho${item.id}`}
                                          disabled={collapse === '1'}
                                          onChange={() => {
                                            setSelectedTable((oldValues) => oldValues.filter((field) => {
                                              if (field.id === item.id) {
                                                field.sizeOfField = !sizeOfField
                                              }
                                              return field;
                                            }))
                                          }}
                                          checked={sizeOfField}
                                        />
                                        <label className="form-check-label" htmlFor={`flexSwitchLimitarTamanho${item.id}`}>Limitar tamanho do campo</label>
                                      </div>
                                    </div>
                                    {sizeOfField && (
                                      <div className="col-12">
                                        <input
                                          type="number"
                                          className="form-control"
                                          placeholder="Tamanho do campo"
                                          aria-label="Tamanho"
                                          aria-describedby="basic-size"
                                          onChange={(e) => {
                                            setSelectedTable((oldValues) => oldValues.filter((field) => {
                                              if (field.id === item.id) {
                                                field.size = Number(e.target.value)
                                              }
                                              return field;
                                            }))
                                          }}
                                          value={size}
                                        />
                                      </div>
                                    )}
                                    {/* Gerar PLU */}
                                    <div className="col-12">
                                      <div className="form-check form-switch" title='Se marcado gera plu'>
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`flexSwitchGeneratePlu${item.genPlu}`}
                                          disabled={collapse === '1'}
                                          onChange={() => {
                                            if (!genPlu === false) {
                                              setIndexCodBarra('');
                                            }
                                            setSelectedTable((oldValues) => oldValues.filter((field) => {
                                              if (field.id === item.id) {
                                                field.genPlu = !genPlu
                                              }
                                              return field;
                                            }))
                                          }}
                                          checked={genPlu}
                                        />
                                        <label className="form-check-label" htmlFor={`flexSwitchGeneratePlu${item.id}`}>Gerar Plu</label>
                                      </div>
                                    </div>
                                    {genPlu && (
                                      <div className="col-12">
                                        <small>Selecione a coluna cod. barras</small>
                                        <select
                                          name="cod_barra_plu"
                                          className="form-control"
                                          aria-label="Default select example"
                                          defaultValue="selecione"
                                          onChange={(e) => {
                                            setIndexCodBarra(e.target.value);
                                            setSelectedTable((oldValues) => oldValues.filter((field) => {
                                              if (field.id === item.id) {
                                                field.indexCodBarras = Number(e.target.value)
                                              }
                                              return field;
                                            }))
                                          }}
                                          id="selectCodBarrasPlu"
                                          disabled={!genPlu}
                                        >
                                          {dadosDoArquivo && dadosDoArquivo[0].map((_item: any, index: any) => {
                                            return (
                                              <option
                                                key={index}
                                                value={`${index}`}
                                              >
                                                {`Index [${index}]`}
                                              </option>)
                                          })}
                                        </select>
                                      </div>
                                    )}
                                    {/* Tratar Cod Barra */}
                                    <div className="col-12">
                                      <div className="form-check form-switch" title='Se marcado trata cod barras'>
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`flexSwitchTrataCodBarra${item.tratarCodBarras}`}
                                          disabled={collapse === '1'}
                                          onChange={() => {
                                            setSelectedTable((oldValues) => oldValues.filter((field) => {
                                              if (field.id === item.id) {
                                                field.tratarCodBarras = !tratarCodBarras
                                              }
                                              return field;
                                            }))
                                          }}
                                          checked={tratarCodBarras}
                                        />
                                        <label className="form-check-label" htmlFor={`flexSwitchTrataCodBarra${item.id}`}>Tratar Cod. Barras</label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* <Card.Text>

                              </Card.Text> */}
                            </Card.Body>
                          </Card>
                        </div>
                      )
                    })}
              </div>
            </form>
            {/* 
                Seleção de campos para Where em caso de update
              */}
            <form id="secondaryForm" onSubmit={(e) => {
              e.preventDefault();
              handleNewWhereClause(e);
            }}>
              {toggleInsertOrUpdate && (
                <div className="col-12 mt-4" style={{ padding: '0px 5px' }}>
                  <h5>Where</h5>
                  <div className="row list-where">
                    <div className="col-md-4 col-sm-12">
                      <Card>
                        <Card.Body>
                          <Card.Subtitle className="mb-2 text-muted">
                            Selecione um campo para where
                          </Card.Subtitle>
                          <Card.Text>
                            <select
                              name="whereCampo"
                              className="form-select"
                              aria-label="Default select example"
                              required
                            >
                              {selectedTable && selectedTable.map((table) => {
                                return (
                                  <option
                                    key={table.id}
                                    value={`{ "index": ${table.id}, "des_campo": "${table.des_campo}", "type": "${table.type}" }`}>
                                    {table.des_campo}
                                  </option>)
                              })}
                            </select>
                            <div className="invalid-feedback">Example invalid select feedback</div>
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-4 col-sm-12">
                      <Card>
                        <Card.Body>
                          <Card.Subtitle className="mb-2 text-muted">
                            Selecione a coluna do arquivo CSV
                          </Card.Subtitle>
                          <Card.Text>
                            <select
                              name="whereColumn"
                              className="form-select"
                              aria-label="Default select example"
                            >
                              {dadosDoArquivo && dadosDoArquivo[0].map((_item: any, index: any) => {
                                return (
                                  <option
                                    key={index}
                                    value={`{ "index": ${index}, "des_column": "Index[${index}]" }`}>
                                    {`Index [${index}]`}
                                  </option>)
                              })}
                            </select>
                            <Button
                              type="submit"
                              variant="primary"
                              className="btn-gerar-campos"
                              form="secondaryForm"
                              // onClick={(e) => handleNewWhereClause(e)}
                              style={{
                                position: 'absolute',
                                right: '15px',
                                top: '20px',
                                width: '50px',
                                borderRadius: '0px 6px 6px 0px',
                                borderColor: '#189AB4',
                              }}
                            >
                              +
                            </Button>
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                  <div className="row list-where">
                    <div className="col-12 px-4">
                      <table className="table table-striped table-style">
                        <thead>
                          <tr>
                            <th scope="col">#</th>
                            <th scope="col">Campo</th>
                            <th scope="col">Coluna</th>
                            <th scope="col" style={{ textAlign: 'center' }}>Remover</th>
                          </tr>
                        </thead>
                        <tbody>
                          {where && where.map((onde, index) => {
                            return (
                              <tr key={index}>
                                <th>{onde.whereCampo.id}</th>
                                <td>{onde.whereCampo.descricao}</td>
                                <td>{onde.whereColumn.descricao}</td>
                                <td className="table-button"><MdDeleteForever onClick={() => {
                                  setWhere((all) => all.filter((whe) => whe.whereCampo.id !== onde.whereCampo.id))
                                }} /></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </form>
            <div className="col-12" style={{ padding: '0px 15px' }}>
              <Button
                type="submit"
                variant="primary"
                className="btn-gerar-campos"
                form="primaryForm"
              // onClick={() => setLoading(true)}
              >
                Gerar
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}

export default Home
