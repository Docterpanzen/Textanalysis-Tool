from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..schemas.admin import AdminLoginRequest, AdminLoginResponse
from ..schemas.texts import TextRead
from ..services.admin_auth import ADMIN_PASSWORD, ADMIN_USERNAME, create_token, require_admin
from ..services.admin_texts import delete_text_if_unused, list_all_texts

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    if payload.username != ADMIN_USERNAME or payload.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    token = create_token()
    return AdminLoginResponse(token=token)


@router.get("/texts", response_model=List[TextRead])
def admin_list_texts(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> List[TextRead]:
    return list_all_texts(db)


@router.delete("/texts/{text_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_text(
    text_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> Response:
    try:
        delete_text_if_unused(db, text_id)
    except ValueError as exc:
        if str(exc) == "not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Text {text_id} not found.",
            )
        if str(exc) == "in_use":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Text is referenced by analysis history and cannot be deleted.",
            )
        raise

    return Response(status_code=status.HTTP_204_NO_CONTENT)
