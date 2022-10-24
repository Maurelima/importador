import type { NextPage } from 'next'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Accordion, Badge, Button, Card, Spinner } from 'react-bootstrap';
import { Container, Header } from '../styles/pages/home'
import { ColumnsProps, ncm } from '../utils/index'

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

const Home: NextPage = () => {
  const [selectedTable, setSelectedTable] = useState<ColumnsProps[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [showCabecalho, setShowCabecalho] = useState<boolean>(true);
  const [toggleSelectAll, setToggleSelectAll] = useState<boolean>(false);
  const [toggleInsertOrUpdate, setToggleInsertOrUpdate] = useState<boolean>(false);
  const [collapse, setCollapse] = useState<string>('1');
  const [selectedCampoWhere, SetSelectedCampoWhere] = useState<string>('');
  const [selectedColunaWhere, setSelectedColunaWhere] = useState<string>('');
  const [where, setWhere] = useState<WhereProps[]>([])

  function handleSetSelectedTable(table: string) {
    setLoading(true);
    switch (table) {
      case 'NCM':
        setSelectedTable(ncm)
        setCollapse('0')
        break;

      case 'SELECIONE':
        setSelectedTable(undefined)
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

    fileReader.readAsText(files[0]);
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

  const handleGerarSql = useCallback((e: any) => {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    /**
     * indiceCampoColuna informa qual campo receberá o valor de cada coluna do arquivo
     * além de qual tipo de dado e dado padrão cada campo receberá.
     */
    let indiceCampoColuna: any = Object.values(data);
    indiceCampoColuna = indiceCampoColuna.map((value: any) => {
      return JSON.parse(value)
    })
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
            whereClause.push(` ${where[k].whereCampo.descricao} = ${dadosDoArquivo[i][where[k].whereColumn.id]}`)
          }
          if (dadosDoArquivo[i][where[k].whereColumn.id] === '') {
            const defaultValue = indiceCampoColuna.find((indice: any) => indice.index === where[k].whereColumn.id);
            if (defaultValue) {
              whereClause.push(` ${where[k].whereCampo.descricao} = ${defaultValue.default}`)
            }
          }
        }
    
        const updateValues = [];
        for (let j = 0; j < values.length; j++) {
          updateValues.push(` ${Object.keys(data)[j]} = ${values[j]}`)
        }
        script.push(`UPDATE ncm\r\n SET${updateValues.join(',\r\n')}\r\nWHERE ${whereClause.join(' and')};\r\n`)
        // script.push(`UPDATE ncm\r\nSET ${updateValues.join(', \r\nAND\r\n')}\r\nWHERE ${whereClause.join(' and')};\r\n`) Update with AND
      }
      const blob = new Blob(script, { type: "text/plain;charset=utf-8" });
      FileSaver.saveAs(blob, "teste.sql");
      // console.log(script)
      // setLoading(false)
      // setTimeout(() => {
      //   console.log('teste');
      //   setLoading(false)
      // }, 1500)
      return;
    }

    // INSERT
    for (let i = 0; i < dadosDoArquivo.length; i++) {
      const values = [];
      // roda todas as opções da linha
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
      script.push(`insert into ncm (${Object.keys(data).join()}) values (${values});\r\n`)
    }
    const blob = new Blob(script, { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "teste.sql");
    // setLoading(false)
    
  }, [dadosDoArquivo, toggleInsertOrUpdate, where]);

  function Teste(e: any) {
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    /**
     * indiceCampoColuna informa qual campo receberá o valor de cada coluna do arquivo
     * além de qual tipo de dado e dado padrão cada campo receberá.
     */
    let indiceCampoColuna: any = Object.values(data);
    indiceCampoColuna = indiceCampoColuna.map((value: any) => {
      return JSON.parse(value)
    })
    const script = [];
    console.log({ data })
    console.log({ dadosDoArquivo })
    console.log({ indiceCampoColuna })
    console.log({ where })
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
            whereClause.push(` ${where[k].whereCampo.descricao} = ${dadosDoArquivo[i][where[k].whereColumn.id]}`)
          }
          if (dadosDoArquivo[i][where[k].whereColumn.id] === '') {
            const defaultValue = indiceCampoColuna.find((indice: any) => indice.index === where[k].whereColumn.id);
            if (defaultValue) {
              whereClause.push(` ${where[k].whereCampo.descricao} = ${defaultValue.default}`)
            }
          }
        }

        const updateValues = [];
        for (let j = 0; j < values.length; j++) {
          updateValues.push(` ${Object.keys(data)[j]} = ${values[j]}`)
        }
        script.push(`UPDATE ncm\r\n SET${updateValues.join(',\r\n')}\r\nWHERE ${whereClause.join(' and')};\r\n`)
        // script.push(`UPDATE ncm\r\nSET ${updateValues.join(', \r\nAND\r\n')}\r\nWHERE ${whereClause.join(' and')};\r\n`) Update with AND
      }
      setLoading(false);
      return;
    }


    // INSERT
    for (let i = 0; i < dadosDoArquivo.length; i++) {
      const values = [];
      // roda todas as opções da linha
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
      script.push(`insert into ncm (${Object.keys(data).join()}) values (${values});\r\n`)
    }

    const blob = new Blob(script, { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "teste.sql");
    setLoading(false);
  }

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

  // useEffect(() => {
  //   if (loading)
  //     console.log({ loading })
  // }, [loading])

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
            <select className="form-select" aria-label="Default select example" onChange={(e) => handleSetSelectedTable(e.target.value)} defaultValue="selecione">
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
              <label className="form-check-label" htmlFor="flexSwitchScriptToUpdate">Update</label>
            </div>
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
                <Accordion.Collapse
                  eventKey={collapse}
                >
                  <>

                    {selectedTable && selectedTable.map((table) => {
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
                      return (
                        <div className="col-md-4 col-sm-12" key={item.id}>
                          <Card>
                            <Card.Body>
                              <Card.Subtitle className="mb-2 text-muted">
                                {item.des_campo}
                              </Card.Subtitle>
                              <Card.Text>
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
                                        value={`{"index": ${index}, "default": ${item.default}, "type": "${item.type}" }`}>
                                        {`Index [${index}]`}
                                      </option>)
                                  })}
                                </select>
                              </Card.Text>
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
                                <th>{index}</th>
                                <td>{onde.whereCampo.descricao}</td>
                                <td>{onde.whereColumn.descricao}</td>
                                <td className="table-button">X</td>
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
