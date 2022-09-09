import styled from 'styled-components'

export const Header = styled.div`
    display: flex;
    height: 120px;
    background: #189AB4;
    padding-left: 50px;

    h1 {
        align-self: flex-end;
        color: #fff;
    }

    .file-button {
        background-color: #3498db;
        border-radius: 5px;
        color: #fff;
        cursor: pointer;
        margin: 10px;
        padding: 6px 20px
    }
`

export const Container = styled.div`
    input::file-selector-button {
        color: #fff;
        background: #05445E;
    }
    .form-check-input {
        box-shadow: none;
    }
    .form-check-input:checked {
        background-color: #189AB4;
    }
    .checkbox-list {
        padding: 20px;
        margin-top: 20px;
        border-radius: 10px;
        background: #D4F1F4;
        display: flex;
        flex-direction: column;

        .expand-button {
            cursor: pointer;
        }

         .collapse {
            margin-top: 20px;
            columns: 3;
            transition: all 0.5s ease-out;
        }
        .collapsing { 
            columns: 3;
            width: 100%;
            height: 100%;
            transition: all 0.5s ease-out;
         }
    }

    .custom-footer {
        width: 100%;
        margin-top: 30px;
        .btn-gerar-campos {
            width: 100%;
            background: #05445E;
        }
    }

    .inputs-list {
        padding: 20px;
        margin-top: 20px;
        border-radius: 10px;
        background: #05445E;
        display: flex;
        flex-direction: column;

        h5 {
            color: #D4F1F4;
        }
        p {
            color: #D4F1F4;
        }

        .badg {
            background: #D4F1F4 !important;
            color: #05445E;
            min-width: 70px;
            height: 30px;
            line-height: 20px;
            text-align: center;
            & + .badge {
                margin-left: 10px;
            }
        }

        .list-container {
            columns: 3;
            .card {
                background: transparent;
                border: none;

                .card-subtitle {
                    color: #189AB4 !important;
                }
                select {
                    background: #D4F1F4;
                    color: #05445E;
                    border-color: #D4F1F4;
                }
            }
        }
        .list-where {
            columns: 3;
            .card {
                background: transparent;
                border: none;

                .card-subtitle {
                    color: #189AB4 !important;
                }
                select {
                    background: #D4F1F4;
                    color: #05445E;
                    border-color: #D4F1F4;
                }
            }
            .table-style {
                margin-top: 20px;
                border-radius: 10px;
                thead {

                    tr{
                        th {
                            background #189AB4;
                            color: #D4F1F4;

                            &:first-child {
                                border-radius: 5px 0px 0px 0px;
                            }
                            &:last-child {
                                border-radius: 0px 5px 0px 0px;
                            }
                        }
                    }
                    
                }
                tbody {
                    background: #D4F1F4;

                    tr {
                        .table-button {
                            text-align: center;
                            color: red;
                            cursor: pointer;
                        }
                    }
                }
            }
        }
        .vincula-label {
            color: #D4F1F4;
        }
        
        .btn-gerar-campos {
            width: 100%;
            margin: 20px 0px;
            background: #189AB4;
        }
    }

`
