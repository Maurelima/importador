import type { NextPage } from 'next'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Accordion, Badge, Button, Card } from 'react-bootstrap';
import { Container, Header } from '../styles/pages/home'
import { ColumnsProps, ncm } from '../utils/index'

import FileSaver from 'file-saver';

const Home: NextPage = () => {
  const [selectedTable, setSelectedTable] = useState<ColumnsProps[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [showCabecalho, setShowCabecalho] = useState<boolean>(true);
  const [toggleSelectAll, setToggleSelectAll] = useState<boolean>(false);
  const [collapse, setCollapse] = useState<string>('1');

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

  function handleGenInputs() {
    setCollapse('1')
    console.log('fechaaa')
  }


  const [fileContent, setFileContent] = useState<any>();
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
      setFileContent(formatedArray);
    };
  };

  function handleGerarSql(e: any) {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    // console.log(data)
    // console.log({ keys: Object.keys(data).join() });
    // console.log({ values: Object.values(data).join() });
    let valuesIndex: any = Object.values(data);
    valuesIndex = valuesIndex.map((value: any) => {
      return JSON.parse(value)
    })
    const script = [];
    console.log({ valuesIndex })
    // roda todas as linhas
    for (let i = 0; i < fileContent.length; i++) {
      const values = [];
      // roda todas as 5 opções da linha
      for (let l = 0; l < valuesIndex.length; l++) {
          if (fileContent[i][valuesIndex[l].index]) {
            values.push(fileContent[i][valuesIndex[l].index])
          }
          
          if (fileContent[i][valuesIndex[l].index] === '') {
            values.push(String(valuesIndex[l].default))
          }
      }
      script.push(`insert into ncm (${Object.keys(data).join()}) values (${values});\r\n`)
      // console.log(`insert into ncm (${Object.keys(data).join()}) values (${values});`)
    }
    // const blob = new Blob(script,
    // { type: "text/plain;charset=utf-8" });
    // window.saveAs(blob, "static.txt");
    const blob = new Blob(script, {type: "text/plain;charset=utf-8"});
    FileSaver.saveAs(blob, "teste.sql");

  }

  useEffect(() => {
    if (fileContent)
      console.log({ fileContent: fileContent })
  }, [fileContent])


  return (
    <>
      <Header className="container-fluid">
        <h1>Importador</h1>
      </Header>
      <Container className="container">
        <div className="row">
          <div className="mt-4 mb-3">
            <label htmlFor="formFile" className="form-label file-button">Importar arquivo CSV</label>
            <input className="form-control" type="file" id="formFile" ref={fileRef} onChange={readFile} />
          </div>
          <div className="col-4">
            <select className="form-select" aria-label="Default select example" onChange={(e) => handleSetSelectedTable(e.target.value)} defaultValue="selecione">
              <option value="SELECIONE">Selecione um modelo de tabela</option>
              <option value="NCM">NCM</option>
              <option value="NCMUF">NCMUF</option>
              <option value="PRODUTO">PRODUTO</option>
            </select>
          </div>
        </div>
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
        </div>
        {/* <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading...</span>
              </div> */}
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
          </div>)}
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
                {/* <Badge bg="secondary">{fileContent[0][0]}</Badge> */}
                {showCabecalho && fileContent && (fileContent[0].map((item: any, index: any) => {
                  return <Badge bg="secondary" className="badg" key={index}>{`${item} - index [${index}]`}</Badge>
                }))}
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleGerarSql(e);
            }}>
              <div className="row list-container">
                {selectedTable
                  && selectedTable.filter((item) => item.visible === true)
                    .map((item) => {
                      return (
                        <div className="col-4" key={item.id}>
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
                                  onChange={(e) => handleSetSelectedTable(e.target.value)}
                                  defaultValue="selecione"
                                >
                                  {fileContent && fileContent[0].map((_item: any, index: any) => {
                                    return <option key={index} value={`{"index": ${index}, "default": ${item.default}}`}>{`Index [${index}]`}</option>
                                  })}
                                </select>
                              </Card.Text>
                            </Card.Body>
                          </Card>
                        </div>
                      )
                    })}

              </div>
              <div className="col-12" style={{ padding: '0px 15px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  className="btn-gerar-campos"
                >
                  Gerar
                </Button>
              </div>
            </form>

          </div>
        </div>
      </Container>
    </>
  )
}

export default Home
