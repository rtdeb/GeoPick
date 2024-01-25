"""Changed model name

Revision ID: d93d55f8c3aa
Revises: 7f38ad795be3
Create Date: 2024-01-18 16:08:02.045599

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd93d55f8c3aa'
down_revision = '7f38ad795be3'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('shared_georeference',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('shortcode', sa.String(length=6), nullable=False),
    sa.Column('geopick_id', sa.String(length=300), nullable=False),
    sa.Column('georef_data', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('geopick_id'),
    sa.UniqueConstraint('shortcode')
    )
    op.drop_table('shared_georeferences')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('shared_georeferences',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('shortcode', sa.VARCHAR(length=6), autoincrement=False, nullable=False),
    sa.Column('georef_data', sa.TEXT(), autoincrement=False, nullable=False),
    sa.Column('geopick_id', sa.VARCHAR(length=300), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id', name='shared_georeferences_pkey'),
    sa.UniqueConstraint('geopick_id', name='shared_georeferences_geopick_id_key'),
    sa.UniqueConstraint('shortcode', name='shared_georeferences_shortcode_key')
    )
    op.drop_table('shared_georeference')
    # ### end Alembic commands ###