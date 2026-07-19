from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
import uuid

def generate_short_id() -> str:
    """Generate a clean, unique short ID for forms."""
    return uuid.uuid4().hex[:12]

class BrandingConfig(BaseModel):
    themeColor: str = "#673ab7"  # Default Google Forms purple
    backgroundColor: str = "#f0ebf8"
    textColor: str = "#202124"
    buttonColor: str = "#673ab7"
    fontFamily: str = "Inter"  # Google fonts: Inter, Roboto, Outfit, Playfair Display, etc.
    logoUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    cardStyle: str = "elevated"  # elevated, flat, glass

class QuestionOption(BaseModel):
    id: str
    text: str

class ValidationRuleModel(BaseModel):
    type: str
    value: Optional[str] = ""
    pattern: Optional[str] = ""
    errorText: Optional[str] = ""
    hasCustomSettings: Optional[bool] = False

class QuestionModel(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    type: str  # text, paragraph, number, radio, checkbox, select, date
    label: str
    required: bool = False
    placeholder: Optional[str] = ""
    options: List[str] = []  # For radio, checkbox, select dropdown
    validationType: str = "none"  # none, phone, email, starts_with, ends_with, length, custom
    validationValue: Optional[str] = ""
    validationPattern: Optional[str] = ""
    validationErrorText: Optional[str] = ""
    validations: List[ValidationRuleModel] = []
    page: int = 1
    order: int = 0

class UserModel(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    username: str
    email: Optional[str] = None
    password_hash: str
    failedAttempts: int = 0
    lockoutUntil: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class ResetCodeModel(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    email: str
    code: str
    expiresAt: datetime
    used: bool = False

class FormModel(BaseModel):
    id: str = Field(default_factory=generate_short_id)
    userId: Optional[str] = None
    title: str = "Untitled Form"
    description: Optional[str] = ""
    branding: BrandingConfig = Field(default_factory=BrandingConfig)
    questions: List[QuestionModel] = []
    acceptingResponses: bool = True
    confirmationMessage: str = "Your response has been recorded."
    showSubmitAnother: bool = True
    customRedirectUrl: Optional[str] = ""
    customRedirectLabel: Optional[str] = ""
    successIcon: str = "checkmark"
    successLayout: str = "classic"
    successDescription: Optional[str] = ""
    successButtons: List[Dict[str, str]] = []
    successSteps: List[str] = []
    showSocialShare: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    responseShareToken: Optional[str] = None
    isLinkedToSheets: bool = False

class ResponseModel(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    formId: str
    answers: Dict[str, Any]  # Key: question.id, Value: user answer (str, list, number)
    submittedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
